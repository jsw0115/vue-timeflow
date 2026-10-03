package kr.timebar.diary.chat.application;

import kr.timebar.diary.chat.infrastructure.jdbc.ChatRepository;
import kr.timebar.diary.common.ApiException;
import kr.timebar.diary.common.ErrorCode;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class ChatSearchAccessTest {
    @Test void validatesRoomMembershipBeforeSearch() {
        var repo=mock(ChatRepository.class); var identity=mock(ChatIdentity.class);
        var service=new ChatService(repo,identity);
        doThrow(new ApiException(ErrorCode.NOT_FOUND)).when(repo).requireMember("private-room","viewer");
        assertThrows(ApiException.class,()->service.search("viewer","회의","private-room",null,40));
        verify(repo,never()).search(any(),any(),any(),any(),anyInt());
    }
    @Test void normalizesQueryAndBoundsPagination() {
        var repo=mock(ChatRepository.class); var service=new ChatService(repo,mock(ChatIdentity.class));
        service.search("viewer"," ＡＢＣ ",null,null,40);
        verify(repo).search("viewer","abc",null,null,40);
        assertThrows(ApiException.class,()->service.search("viewer"," ",null,null,40));
        assertThrows(ApiException.class,()->service.search("viewer","회의",null,null,101));
        assertThrows(ApiException.class,()->service.search("viewer","회의",null,"not-a-cursor",40));
        assertThrows(ApiException.class,()->service.visiblePeople("viewer",java.util.Collections.nCopies(101,"other")));
    }
}
