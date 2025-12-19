/**
 * Project Color-Loop Stages Data
 * 각 스테이지의 시작 메시지, 맵 코드, 클리어 메시지를 관리합니다.
 */
const STAGES_DATA = [
    {
        "level": 1,
        "startMessage": "첫 번째 단계입니다. 색칠되지 않은 모든 타일을 칠해보세요!",
        "mapCode": "V2|9x10|2,4|999999999999999999999999999999999999990000099999999999999999999999999999999999999999999999|THYxJTdDdHV0b3JpYWw=|0035cc2f6b",
        "clearMessage": "축하합니다! 기초적인 이동과 색칠에 성공하셨습니다."
    },
    {
        "level": 2,
        "startMessage": "두 번째 단계! 길이 조금 더 복잡해졌습니다. 신중하게 움직이세요.",
        "mapCode": "V2|9x10|2,4|999999999999999999999999999999999999990000099999900999999999999999999999999999999999999999|THYyJTdDdHV0b3JpYWw=|001b72274c",
        "clearMessage": "잘하셨습니다! 다음 단계로 넘어갈 준비가 되셨나요?"
    },
    {
        "level": 3,
        "startMessage": "세 번째 단계! 사용자가 직접 설계한 새로운 도전 과제입니다. 좁은 길을 조심하세요!",
        "mapCode": "V2|10x10|4,4|9999999999999999999999990000999999099099999909909999003000999909099999990909999999000999999999999999|JUVDJUJCJUE0JUVDJThBJUE0JUVEJTg1JTgwJTIwJUVCJUEwJTg4JUVCJUIyJUE4JTdDJUVDJUEwJTlDJUVDJTlFJTkxJUVDJTlFJTkw|000abc2a80",
        "clearMessage": "훌륭합니다! 사용자가 만든 어려운 퍼즐을 멋지게 통과하셨습니다."
    },
    {
        "level": 4,
        "startMessage": "다음 맵은 살짝 헷갈릴걸요?",
        "mapCode": "V2|10x10|1,1|9990009999909090999990901009999000090999999909099999990009999999999999999999999999999999999999999999|JUVDJUJCJUE0JUVDJThBJUE0JUVEJTg1JTgwJTIwJUVCJUEwJTg4JUVCJUIyJUE4JTdDJUVDJUEwJTlDJUVDJTlFJTkxJUVDJTlFJTkw|004bc59a1e",
        "clearMessage": "한번쯤은 실수하셨죠? 의도한 겁니다!"
    },
    {
        "level": 5,
        "startMessage": "포탈타일과 두번밟기가능한 타일도 사용해보아요!",
        "mapCode": "V2|10x10|1,1|9999999999900089999999999999999999999999999999009999999905099999999099990000009999090099999900008999|dHV0b3JpYWwlN0Njb3Jlb3JkZXJz|006c8c4726",
        "clearMessage": "참 잘하셨어요!"
    },
    {
        "level": 6,
        "startMessage": "색상이 조금 더 다양하게 배치된 맵입니다. 효율적인 경로를 구상해보세요!",
        "mapCode": "V3|10,10|1,1|mZmZmZmQCZmZmZkAAACZmQAQAJmZAAIAmZkAAACZmQAAAJmZmZmZmZmZmZmZmZmZmZk=|JUVDJUJCJUE0JUVDJThBJUE0JUVEJTg1JTgwJTIwJUVCJUEwJTg4JUVCJUIyJUE4JTdDJUVDJUEwJTlDJUVDJTlFJTkxJUVDJTlFJTkw|1ba504",
        "clearMessage": "훌륭합니다! 이제 복잡한 맵도 거뜬하시겠군요."
    },
    {
        "level": 7,
        "startMessage": "일곱 번째 도전! 색상의 흐름을 잘 파악하여 막다른 길에 갇히지 않도록 주의하세요.",
        "mapCode": "V3|10,10|1,1|kFAAAJmQCZmQOZAJmZEJkAmZkAmQAAAACZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZk=|JUVDJUJCJUE0JUVDJThBJUE0JUVEJTg1JTgwJTIwJUVCJUEwJTg4JUVCJUIyJUE4JTdDJUVDJUEwJTlDJUVDJTlFJTkxJUVDJTlFJTkw|4f28c6",
        "clearMessage": "훌륭합니다! 이제 퍼즐의 고수가 다 되셨군요."
    },
    {
        "level": 8,
        "startMessage": "여덟 번째 단계! 더욱 정교한 움직임이 필요합니다. 전체적인 구조를 먼저 살펴보세요.",
        "mapCode": "V3|10,10|1,1|mZmZmZmQAAAAAJBQmZmQmQCZmZCQAAAAAJCZCZmZkJkJmZmQmQmZmZCZCZmZkAAJmZk=|JUVDJUJCJUE0JUVDJThBJUE0JUVEJTg1JTgwJTIwJUVCJUEwJTg4JUVCJUIyJUE4JTdDJUVDJUEwJTlDJUVDJTlFJTkxJUVDJTlFJTkw|7c101d",
        "clearMessage": "훌륭합니다! 이제 퍼즐의 진정한 매력을 느끼고 계시는군요."
    },
    {
        "level": 9,
        "startMessage": "처음엔 기초가 제일어려워!",
        "mapCode": "V3|10,10|1,1|mZmZmZmQACmZmZAACZmZkAAJmZmTAAmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZmZk=|JUVDJUJCJUE0JUVDJThBJUE0JUVEJTg1JTgwJTIwJUVCJUEwJTg4JUVCJUIyJUE4JTdDJUVDJUEwJTlDJUVDJTlFJTkxJUVDJTlFJTkw|3a4fbb",
        "clearMessage": "훌륭합니다! 단순해보이지만 복잡해요!"
    },
    {
        "level": 10,
        "startMessage": "대망의 마지막 공식 스테이지입니다. 모든 실력을 발휘하세요!",
        "mapCode": "V2|10x10|1,1|0000000999009990099999909050990005900999000505099999999999999999999999999999999999999999999999999999|dHV0b3JpYWwlN0Njb3Jlb3JkZXJz|00412fe1ff",
        "clearMessage": "축하합니다! 모든 공식 스테이지를 정복하셨습니다. 이제 '맵 만들기'를 통해 친구를 골탕 먹여보세요!"
    }
];
