package kr.timebar.diary.quality;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;

import static org.junit.jupiter.api.Assertions.assertAll;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** A narrow source-format check for the new modules; this does not replace Checkstyle. */
class JavaConventionTest {
    private static final Path SOURCE_ROOT = Path.of("src/main/java");

    @ParameterizedTest(name = "Naming: {0}")
    @MethodSource("newModuleSources")
    void fileAndPublicTypeFollowNamingConvention(Path file) throws IOException {
        String source = Files.readString(file, StandardCharsets.UTF_8);
        String relativeFile = SOURCE_ROOT.relativize(file).toString().replace('\\', '/');
        String packageName = relativeFile.substring(0, relativeFile.lastIndexOf('/')).replace('/', '.');
        String fileName = file.getFileName().toString();
        String typeName = fileName.substring(0, fileName.length() - ".java".length());
        Pattern declaration = Pattern.compile("public\\s+(?:(?:final|abstract)\\s+)?"
                + "(?:class|interface|record|enum)\\s+" + Pattern.quote(typeName) + "\\b");

        assertAll(
                () -> assertTrue(typeName.matches("[A-Z][A-Za-z0-9]*"), "Use PascalCase type names: " + file),
                () -> assertTrue(packageName.matches("[a-z][a-z0-9]*(?:\\.[a-z][a-z0-9]*)*"),
                        "Use lowercase package names: " + file),
                () -> assertTrue(source.startsWith("package " + packageName + ";\n"),
                        "Package must match the source directory: " + file),
                () -> assertTrue(declaration.matcher(source).find(),
                        "Public type must match its filename: " + file));
    }

    @ParameterizedTest(name = "Formatting: {0}")
    @MethodSource("newModuleSources")
    void sourceUsesExplicitImportsAndConsistentWhitespace(Path file) throws IOException {
        String source = Files.readString(file, StandardCharsets.UTF_8);
        assertAll(
                () -> assertFalse(source.contains("\r"), "Use LF newlines: " + file),
                () -> assertTrue(source.endsWith("\n"), "End the file with a newline: " + file),
                () -> assertFalse(source.contains("\t"), "Indent with spaces: " + file),
                () -> assertFalse(Pattern.compile("(?m)^import\\s+(?:static\\s+)?[^;]*\\.\\*;")
                        .matcher(source).find(), "Use explicit imports: " + file));
        assertLineWhitespace(file, source);
    }

    private void assertLineWhitespace(Path file, String source) {
        String[] lines = source.split("\n", -1);
        for (int index = 0; index < lines.length; index++) {
            String line = lines[index];
            String location = file + ":" + (index + 1);
            assertEquals(line.stripTrailing(), line, "Remove trailing whitespace at " + location);
            // Javadoc's leading '*' is a comment marker, not a code indentation level.
            if (line.isBlank() || line.stripLeading().startsWith("*")) {
                continue;
            }
            int indentation = line.length() - line.stripLeading().length();
            assertEquals(0, indentation % 4, "Use four-space indentation at " + location);
        }
    }

    private static Stream<Path> newModuleSources() throws IOException {
        List<Path> files = new ArrayList<>();
        for (String module : List.of("kr/timebar/diary/task/checklist", "kr/timebar/diary/planner/preferences")) {
            Path directory = SOURCE_ROOT.resolve(module);
            assertTrue(Files.isDirectory(directory), "Module source directory is missing: " + directory);
            try (Stream<Path> paths = Files.walk(directory)) {
                files.addAll(paths.filter(path -> path.toString().endsWith(".java")).sorted().toList());
            }
        }
        assertFalse(files.isEmpty(), "New modules must contain Java sources.");
        return files.stream();
    }
}
