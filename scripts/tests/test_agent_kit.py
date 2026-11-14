# 에이전트 작업 기록과 진단 보고서의 보존·입력 검증 동작을 시험한다.
import csv
import hashlib
import importlib.util
import shutil
import subprocess
import sys
import tempfile
import unittest
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
FIELDS = ('finding_id', 'file', 'line', 'rule_id', 'snippet')
APPROVAL = ('fingerprint', 'decision', 'reviewer', 'evidence', 'expires_on')


class AgentKitTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix='timebar-kit-test-')
        self.addCleanup(self.temporary.cleanup)
        self.work = Path(self.temporary.name)

    def run_script(self, name, *args, script=None):
        return subprocess.run(
            [sys.executable, '-X', 'utf8', '-B', str(script or ROOT/'scripts'/name), *map(str, args)],
            cwd=self.work, capture_output=True, text=True, encoding='utf-8', timeout=20,
        )

    def write_csv(self, name, fields, rows):
        path = self.work/name
        with path.open('w', encoding='utf-8-sig', newline='') as output:
            writer = csv.DictWriter(output, fieldnames=fields)
            writer.writeheader()
            writer.writerows(rows)
        return path

    def read_csv(self, path):
        with path.open(encoding='utf-8-sig', newline='') as source:
            return list(csv.DictReader(source))

    def findings(self):
        rows = [
            dict(zip(FIELDS, ('tag', 'view.jsp', '1', 'rule-1', '<%@ taglib prefix="c" uri="test" %>'))),
            dict(zip(FIELDS, ('sink', 'view.jsp', '2', 'rule-2', '<script>${input}</script>'))),
            dict(zip(FIELDS, ('vue', 'View.vue', '3', 'rule-1', '<%@ page contentType="text/html" %>'))),
        ]
        return self.write_csv('findings.csv', FIELDS, rows), rows

    def approval(self, row, **changes):
        result = dict(zip(APPROVAL, (
            hashlib.sha256('\x1f'.join(row[key] for key in FIELDS).encode('utf-8')).hexdigest(),
            'FALSE_POSITIVE_APPROVED', 'test-reviewer', 'local-test-evidence',
            (date.today() + timedelta(days=1)).isoformat(),
        )))
        result.update(changes)
        return result

    def exclude(self, source, approvals, remaining='remaining.csv', excluded='excluded.csv'):
        return self.run_script('apply_approved_exclusions.py', '--input', source,
                               '--approvals', approvals, '--remaining', self.work/remaining,
                               '--excluded', self.work/excluded)

    def task_script(self):
        script = self.work/'scripts/start_task.py'
        script.parent.mkdir()
        shutil.copyfile(ROOT/'scripts/start_task.py', script)
        shutil.copytree(ROOT/'docs/agent/templates', self.work/'docs/agent/templates')
        return script

    def test_task_creation_uses_seoul_date_and_preserves_existing_record(self):
        script = self.task_script()
        before = datetime.now(timezone(timedelta(hours=9))).date()
        result = self.run_script('', '--task', '한글-task', script=script)
        self.assertEqual(result.returncode, 0, result.stderr)
        records = list((self.work/'docs/agent/records').iterdir())
        self.assertEqual(len(records), 1)
        after = datetime.now(timezone(timedelta(hours=9))).date()
        self.assertIn(records[0].name, {f'{day}-한글-task' for day in (before, after)})
        self.assertEqual({p.name for p in records[0].iterdir()},
                         {'plan.md', 'checklist.md', 'context-notes.md', 'verification.md'})
        plan = records[0]/'plan.md'
        plan.write_text('existing work', encoding='utf-8')
        repeat = self.run_script('', '--task', '한글-task', script=script)
        self.assertNotEqual(repeat.returncode, 0)
        self.assertEqual(plan.read_text(encoding='utf-8'), 'existing work')

    def test_task_rejects_path_traversal_and_invalid_names(self):
        script = self.task_script()
        for name in ('../escape', '..\\escape', 'C:\\escape', 'with space', 'a'*61):
            with self.subTest(name=name):
                self.assertNotEqual(self.run_script('', '--task', name, script=script).returncode, 0)
        self.assertFalse((self.work/'docs/agent/records').exists())

    def test_missing_template_does_not_leave_partial_task(self):
        script = self.task_script()
        (self.work/'docs/agent/templates/verification.md').unlink()
        self.assertNotEqual(self.run_script('', '--task', 'missing', script=script).returncode, 0)
        self.assertFalse((self.work/'docs/agent/records').exists())

    def test_triage_only_marks_candidates_and_preserves_source(self):
        source, rows = self.findings()
        original = source.read_bytes()
        output = self.work/'triage.csv'
        result = self.run_script('triage_jsp_findings.py', '--input', source, '--output', output)
        self.assertEqual(result.returncode, 0, result.stderr)
        report = self.read_csv(output)
        self.assertEqual([r['classification'] for r in report],
                         ['REVIEW_CANDIDATE', 'NEEDS_REVIEW', 'NEEDS_REVIEW'])
        self.assertEqual([r['approved_exclusion'] for r in report], ['NO']*3)
        self.assertEqual(report[0]['fingerprint'], self.approval(rows[0])['fingerprint'])
        self.assertEqual(source.read_bytes(), original)

    def test_triage_rejects_source_alias_and_existing_output(self):
        source, _ = self.findings()
        original = source.read_bytes()
        for output in (source, self.work/'existing.csv'):
            output.write_bytes(original)
            result = self.run_script('triage_jsp_findings.py', '--input', source, '--output', output)
            self.assertNotEqual(result.returncode, 0)
            self.assertEqual(output.read_bytes(), original)

    def test_malformed_findings_fail_without_output(self):
        bad = self.work/'bad.csv'
        approvals = self.write_csv('approvals.csv', APPROVAL, [])
        for content in ('file,line\na.jsp,1\n', ','.join(FIELDS)+'\n1,a.jsp\n',
                        ','.join(FIELDS)+'\n1,a.jsp,1,r,s,extra\n'):
            with self.subTest(content=content):
                bad.write_text(content, encoding='utf-8')
                triage = self.run_script('triage_jsp_findings.py', '--input', bad,
                                         '--output', self.work/'triage.csv')
                self.assertNotEqual(triage.returncode, 0)
                self.assertNotEqual(self.exclude(bad, approvals).returncode, 0)
                self.assertFalse((self.work/'triage.csv').exists())
                self.assertFalse((self.work/'remaining.csv').exists())

    def test_only_exact_approved_finding_is_separated(self):
        source, rows = self.findings()
        approvals = self.write_csv('approvals.csv', APPROVAL, [self.approval(rows[0])])
        originals = (source.read_bytes(), approvals.read_bytes())
        result = self.exclude(source, approvals)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual([r['finding_id'] for r in self.read_csv(self.work/'remaining.csv')], ['sink', 'vue'])
        excluded = self.read_csv(self.work/'excluded.csv')
        self.assertEqual([r['finding_id'] for r in excluded], ['tag'])
        self.assertEqual(excluded[0]['exclusion_evidence'], 'local-test-evidence')
        self.assertEqual((source.read_bytes(), approvals.read_bytes()), originals)

    def test_no_approvals_preserves_all_findings(self):
        source, rows = self.findings()
        approvals = self.write_csv('approvals.csv', APPROVAL, [])
        result = self.exclude(source, approvals)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.read_csv(self.work/'remaining.csv'), rows)
        self.assertEqual(self.read_csv(self.work/'excluded.csv'), [])

    def test_invalid_expired_duplicate_and_stale_approvals_are_rejected(self):
        source, rows = self.findings()
        valid = self.approval(rows[0])
        cases = [
            [dict(valid, evidence='')], [dict(valid, reviewer='')],
            [dict(valid, expires_on='2000-01-01')], [dict(valid, expires_on='invalid')],
            [dict(valid, decision='REVIEW')], [dict(valid, fingerprint='bad')],
            [dict(valid, fingerprint='0'*64)], [valid, valid],
        ]
        for approvals_rows in cases:
            with self.subTest(approvals=approvals_rows):
                approvals = self.write_csv('approvals.csv', APPROVAL, approvals_rows)
                result = self.exclude(source, approvals)
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse((self.work/'remaining.csv').exists())
                self.assertFalse((self.work/'excluded.csv').exists())

    def test_exclusion_rejects_output_alias_and_preserves_existing_report(self):
        source, _ = self.findings()
        approvals = self.write_csv('approvals.csv', APPROVAL, [])
        original = source.read_bytes()
        self.assertNotEqual(self.exclude(source, approvals, remaining='findings.csv').returncode, 0)
        self.assertEqual(source.read_bytes(), original)
        existing = self.work/'excluded.csv'
        existing.write_text('previous evidence', encoding='utf-8')
        self.assertNotEqual(self.exclude(source, approvals).returncode, 0)
        self.assertEqual(existing.read_text(encoding='utf-8'), 'previous evidence')
        self.assertFalse((self.work/'remaining.csv').exists())

    def test_structural_verifier_fails_on_duplicate_ids_and_broken_links(self):
        spec = importlib.util.spec_from_file_location('verify_agent_kit', ROOT/'scripts/verify_agent_kit.py')
        verifier = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(verifier)
        security = self.work/'security'
        security.mkdir()
        checklist = (ROOT/'security/SW_SECURE_CODING_49.md').read_text(encoding='utf-8')
        (security/'SW_SECURE_CODING_49.md').write_text(checklist.replace('| SC-49 |', '| SC-48 |'), encoding='utf-8')
        (self.work/'PROJECT_CONTEXT.md').write_text('[missing](not-present.md)', encoding='utf-8')
        errors = verifier.verify(self.work)
        self.assertTrue(any('SW_SECURE_CODING_49.md:' in error for error in errors))
        self.assertTrue(any('not-present.md' in error for error in errors))
        self.assertTrue(any('AGENTS.md' in error for error in errors))


if __name__ == '__main__':
    unittest.main()
