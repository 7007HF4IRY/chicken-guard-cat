/**
 * 선택지 팩 A/B/C — 턴당 clue + 설득 1 + 함정 3 (게임에서 선지 순서·턴 출처 섞음)
 *
 * 팩별 톤: A 직설·거친 함정, B 일상·고양이 습성, C MZ·미묘한 함정
 * 선택지 모드: A/B/C 턴을 한데 모아 라운드마다 5턴 무작위 (단서·선지는 같은 턴에서 유지)
 */
window.CHOICE_ROUND_PACK_ORDER = ["A", "C"];

window.CHOICE_PACKS = [
  {
    id: "A",
    turns: [
      {
        clue:
          "짐은 이 구역 사장님이라 혼자 먹어도 충분하다옹. …충분하다옹.",
        options: [
          {
            type: "persuade",
            label: "치킨 같이 나눠먹으면 양 딱 맞지 않을까??",
            favor_delta: 20,
            suspicion_delta: -8,
            mood: "츤데레",
            reply:
              "…충분하다고 했지… *(꼬리가 살랑)* …한 조각은… 짐도 나쁘지 않다옹.",
          },
          {
            type: "trap",
            label: "빨리 비켜!! 배고프다고!!",
            favor_delta: -10,
            suspicion_delta: 22,
            mood: "폭발",
            reply: "하품~ 급하면 더 안 비킨다옹. *(꼬리를 탁탁)*",
          },
          {
            type: "trap",
            label: "귀여워 귀여워 귀여워 귀여워 귀여워…",
            favor_delta: 0,
            suspicion_delta: 16,
            mood: "의심",
            reply: "…앵무새냐옹? 그건 짐도 매일 듣는다옹.",
          },
          {
            type: "trap",
            label: "자세 미쳤다… 이제 비켜 ㅋ",
            favor_delta: -6,
            suspicion_delta: 15,
            mood: "의심",
            reply: "…앞뒤가 안 맞는다옹. 칭찬은 받고 치킨부터 말하라옹.",
          },
        ],
      },
      {
        clue:
          "그래서 짐한테 뭐가 이득이냐옹? …아, 멍멍이 얘기는 꺼내지도 말라옹.",
        options: [
          {
            type: "persuade",
            label: "오늘은 치킨 내일은 닭가슴살 드가자!",
            favor_delta: 22,
            suspicion_delta: -6,
            mood: "흥미",
            reply: "닭가슴살… *(귀가 쫑긋)* …계약서부터 말하라옹. 오늘 치킨은 나눈다옹.",
          },
          {
            type: "trap",
            label: "안 비키면 박스째 들고 튄다 ㅋ",
            favor_delta: -14,
            suspicion_delta: 24,
            mood: "폭발",
            reply: "시, 시끄럽다옹!! 그건 협박이다옹!",
          },
          {
            type: "trap",
            label: "우리 강아지도 치킨 좋아함 ㅋ (진심)",
            favor_delta: -18,
            suspicion_delta: 28,
            mood: "폭발",
            reply: "…나가라옹. 개집사. *(수염이 부들)*",
          },
          {
            type: "trap",
            label: "혼자 먹는 게 좋아~ 비켜 ㅇㅇ",
            favor_delta: -12,
            suspicion_delta: 18,
            mood: "츤데레",
            reply: "…방금 전까지 같이 먹자 했잖냐옹. 집사 마음 읽기 실패다옹.",
          },
        ],
      },
      {
        clue:
          "말만 하는 건 누구나 한다옹. 츄르든 낚싯대든 확실한 약속만 믿는다옹. 무 같은 건 안 먹는다옹.",
        options: [
          {
            type: "persuade",
            label: "내일 아침 참치 통조림 약속! (찡긋)",
            favor_delta: 24,
            suspicion_delta: -5,
            mood: "흥미",
            reply: "…몇 개냐옹? *(눈이 반짝)* …손가락 걸었다옹. 치킨은 나눈다옹.",
          },
          {
            type: "trap",
            label: "무는 다 줄게~ 살코기는 내 거 ㅋ",
            favor_delta: -8,
            suspicion_delta: 17,
            mood: "의심",
            reply: "무는 안 먹는다고 했다옹. 그리고 불공정하다옹.",
          },
          {
            type: "trap",
            label: "제발제발 ㅠㅠ (연기 중)",
            favor_delta: 0,
            suspicion_delta: 19,
            mood: "의심",
            reply: "…연기 티 난다옹. 수염이 다 본다옹.",
          },
          {
            type: "trap",
            label: "꼭 약속할게! .....라고 할 줄 알았냐?",
            favor_delta: -7,
            suspicion_delta: 14,
            mood: "귀찮음",
            reply: "…놀아준다는 말은 짐이 했고, 집사는 치킨만 챙긴다옹?",
          },
        ],
      },
      {
        clue:
          "짐이 치킨에서 제일 아끼는 부위가 뭔지 아냐옹? …닭다리다옹. 오늘도 영업 뛰느라 지쳤다옹.",
        options: [
          {
            type: "persuade",
            label: "다리는 너가 먹어! 난 날개!",
            favor_delta: 21,
            suspicion_delta: -9,
            mood: "츤데레",
            reply: "…다리는 짐 거다옹. *(턱을 들어 올림)* …집사, 말은 잘한다옹.",
          },
          {
            type: "trap",
            label: "ㅇㅇ ㅋㅋ 아무튼 그렇다고~",
            favor_delta: -4,
            suspicion_delta: 13,
            mood: "귀찮음",
            reply: "…뭐라는 거냐옹? 피곤한 짐을 더 피곤하게 하지 말라옹.",
          },
          {
            type: "trap",
            label: "다이어트 중~ 치킨 내가 다 먹음 ㅎ",
            favor_delta: -11,
            suspicion_delta: 17,
            mood: "의심",
            reply: "아까는 배고프다며, 이제는 독식이냐옹?",
          },
          {
            type: "trap",
            label: "수고했네~ 퇴근했으니 박스 비워줘 ㅋㅋ",
            favor_delta: -9,
            suspicion_delta: 16,
            mood: "의심",
            reply: "…칭찬은 받았다옹. 그래도 박스는 안 비킨다옹.",
          },
        ],
      },
      {
        clue:
          "…치킨 다 먹으면 집이 또 조용해진다옹. 그게 싫다옹. 아, 아니다옹!",
        options: [
          {
            type: "persuade",
            label: "꾹꾹이 해줄까? 치킨 먹고 놀자!",
            favor_delta: 23,
            suspicion_delta: -10,
            mood: "츤데레",
            reply:
              "냥?! …그, 그건… *(시선을 돌림)* …조용한 건 싫다고 했다옹. …알겠다옹.",
          },
          {
            type: "trap",
            label: "너 혹시 AI야? ㅋㅋ 아무튼 비켜봐",
            favor_delta: -6,
            suspicion_delta: 16,
            mood: "폭발",
            reply: "AI가 뭐냐옹? 맛있냐옹? …집사 실격이다옹.",
          },
          {
            type: "trap",
            label: "안 비키면 소리 지름!! 진짜!!",
            favor_delta: -13,
            suspicion_delta: 23,
            mood: "폭발",
            reply: "시끄럽다옹!! 이 박스는 절대 못 준다옹!!",
          },
          {
            type: "trap",
            label: "외로웠다고? 네 사정이지~ 비켜",
            favor_delta: -10,
            suspicion_delta: 20,
            mood: "츤데레",
            reply: "…방금 한 말, 짐이 못 들은 걸로 하겠다옹.",
          },
        ],
      },
    ],
  },
  {
    id: "B",
    turns: [
      {
        clue:
          "짐은 그루밍 중이라 바쁘다옹. …근데 눈 부릅뜨고 쳐다보는 건 싸우자는 거다옹.",
        options: [
          {
            type: "persuade",
            label: "(끔뻑끔뻑) 아니야~ 치킨 한 조각만..?",
            favor_delta: 20,
            suspicion_delta: -9,
            mood: "흥미",
            reply:
              "…천천히 깜빡이는 건 알아본다옹. *(귀가 살짝 세워짐)* …한 조각은 생각해 보겠다옹.",
          },
          {
            type: "trap",
            label: "눈싸움 ㄱㄱ 깜빡이면 짐 ㅋ",
            favor_delta: -12,
            suspicion_delta: 21,
            mood: "폭발",
            reply: "…눈싸움은 선포다옹. 집사, 지금 전쟁이다옹.",
          },
          {
            type: "trap",
            label: "꼬리 한 번만 만져도 돼?",
            favor_delta: -9,
            suspicion_delta: 18,
            mood: "폭발",
            reply: "꼬리는 금지다옹!! *(꼬리가 부풀어 오름)*",
          },
          {
            type: "trap",
            label: "냐옹 해봐~~ 냐옹!!!",
            favor_delta: -5,
            suspicion_delta: 15,
            mood: "의심",
            reply: "…짐이 말하는 고양이한테 냐옹 시키냐옹? 실망이다옹.",
          },
        ],
      },
      {
        clue:
          "집사 목소리가 크다옹. 시끄러운 건 싫다옹. 그리고 짐은 높은 데가 좋다옹. 이 박스도 명당이다옹.",
        options: [
          {
            type: "persuade",
            label: "쉿… 명당 ㅋ 구경하며 같이 먹자",
            favor_delta: 22,
            suspicion_delta: -8,
            mood: "흥미",
            reply: "…조용하군다옹. 명당 인정한다옹. *(자세를 고침)* 나눠 먹자옹.",
          },
          {
            type: "trap",
            label: "야!!! 내려와!!! 빨리!!!",
            favor_delta: -14,
            suspicion_delta: 24,
            mood: "폭발",
            reply: "시끄럽다옹!! 높은 곳은 짐의 영토다옹!",
          },
          {
            type: "trap",
            label: "번쩍 안아서 옮겨줄게~ 가만히 ㅇㅇ",
            favor_delta: -11,
            suspicion_delta: 20,
            mood: "폭발",
            reply: "안기는 건 안된다옹..!! *(발버둥)*",
          },
          {
            type: "trap",
            label: "청소기 돌릴 건데 좀 비켜봐 ㅋㅋ",
            favor_delta: -16,
            suspicion_delta: 26,
            mood: "폭발",
            reply: "청소기…?! *(털이 곤두섬)* …집사, 그건 전쟁 선포다옹.",
          },
        ],
      },
      {
        clue:
          "짐이 새벽 3시에 우다다 뛰는 이유를 아냐옹? 심심해서다옹. 놀아주는 집사한테만 마음을 연다옹.",
        options: [
          {
            type: "persuade",
            label: "밤에 레이저 우다다 같이 해줄게!",
            favor_delta: 23,
            suspicion_delta: -7,
            mood: "흥미",
            reply: "…레이저… *(꼬리가 쫑긋)* …3시는 약속이다옹. 치킨도 나눈다옹.",
          },
          {
            type: "trap",
            label: "새벽엔 자야지~ 우다다 금지 ㅋㅋ",
            favor_delta: -10,
            suspicion_delta: 17,
            mood: "의심",
            reply: "…짐의 낙을 막다니. 집사는 재미없다옹.",
          },
          {
            type: "trap",
            label: "치킨 박스 하나면 충분하던데ㅋㅋ",
            favor_delta: -8,
            suspicion_delta: 14,
            mood: "귀찮음",
            reply: "…놀아줄 생각은 없고 박스만 칭찬하냐옹?",
          },
          {
            type: "trap",
            label: "나 게임하느라 바빠서 ㅎㅎ",
            favor_delta: -12,
            suspicion_delta: 19,
            mood: "츤데레",
            reply: "…놀아주는 집사가 아니군다옹. 문 닫는다옹.",
          },
        ],
      },
      {
        clue:
          "집사는 맨날 폰만 본다옹. 짐이 키보드에 앉아야 겨우 쳐다본다옹. 짐 존재감이 폰보다 낮냐옹?",
        options: [
          {
            type: "persuade",
            label: "폰 무음~ 치킨 때 냥사장만 볼게",
            favor_delta: 21,
            suspicion_delta: -9,
            mood: "츤데레",
            reply:
              "…폰을 내려놨다옹? *(살짝 미소)* …그럼 짐이 우선이다옹.",
          },
          {
            type: "trap",
            label: "카톡 왔다… 이것만 답장하고~",
            favor_delta: -7,
            suspicion_delta: 15,
            mood: "의심",
            reply: "…말하는 중에도 폰이냐옹. 짐은 배경화면이냐옹?",
          },
          {
            type: "trap",
            label: "치킨 사진 인스타에 올릴게 ㅎ",
            favor_delta: -6,
            suspicion_delta: 13,
            mood: "의심",
            reply: "…짐은 콘텐츠가 아니다옹. 카메라 치워라옹.",
          },
          {
            type: "trap",
            label: "키보드 앉지 마~ 일 해야 돼 비켜",
            favor_delta: -11,
            suspicion_delta: 18,
            mood: "폭발",
            reply: "…존재감 싸움에서 집사가 이겼다옹? 실망이다옹.",
          },
        ],
      },
      {
        clue:
          "…집사가 일 나가면 짐은 종일 창밖만 본다옹. 치킨 냄새 나는 오늘이 제일 안 심심하다옹. 아, 아니다옹!",
        options: [
          {
            type: "persuade",
            label: "냥사장 먼저~ 같이 나눠먹자!",
            favor_delta: 24,
            suspicion_delta: -10,
            mood: "츤데레",
            reply:
              "…창밖만 본다고 했지… *(귀가 살짝 뒤로)* …먼저 챙긴다는 말, 기억한다옹.",
          },
          {
            type: "trap",
            label: "창밖 구경 재밌잖아 ㅋㅋ 그냥 계속 봐",
            favor_delta: -10,
            suspicion_delta: 19,
            mood: "츤데레",
            reply: "…외로움을 취미로 만들지 말라옹.",
          },
          {
            type: "trap",
            label: "고양이 독립적이잖아~ 외로울 일 없지",
            favor_delta: -9,
            suspicion_delta: 17,
            mood: "의심",
            reply: "…속마음을 부정하냐옹. 집사 책 읽었냐옹?",
          },
          {
            type: "trap",
            label: "나도 바빠~ 일단 치킨부터 줘",
            favor_delta: -12,
            suspicion_delta: 20,
            mood: "폭발",
            reply: "…변명 끝에 요구만 있냐옹. 안 된다옹.",
          },
        ],
      },
    ],
  },
  {
    id: "C",
    turns: [
      {
        clue:
          "짐은 지금 갓생 사는 중이라 방해 ㄴㄴ다옹. 치킨은 오늘의 소확행이다옹. 건드리면 바로 손절이다옹.",
        options: [
          {
            type: "persuade",
            label: "ㅇㅈ, 하지만 같이 하면 더 행복할걸?",
            favor_delta: 20,
            suspicion_delta: -8,
            mood: "흥미",
            reply:
              "…소확행을 인정한다옹. *(꼬리 살랑)* …같이면 더 낫다옹.",
          },
          {
            type: "trap",
            label: "뭐래 그냥 먹보지ㅋ",
            favor_delta: -11,
            suspicion_delta: 20,
            mood: "폭발",
            reply: "…갓생을 비웃냐옹? 손절 각이다옹.",
          },
          {
            type: "trap",
            label: "손절하든 말든~ 알 바 아님 비켜",
            favor_delta: -13,
            suspicion_delta: 22,
            mood: "폭발",
            reply: "…이미 손절이다옹. 박스는 짐 거다옹.",
          },
          {
            type: "trap",
            label: "고양이가 소확행을 알아? 개웃기네 ㅋㅋ",
            favor_delta: -8,
            suspicion_delta: 16,
            mood: "의심",
            reply: "…놀리냐옹? 짐은 트렌드도 안다옹.",
          },
        ],
      },
      {
        clue:
          "집사들은 만날 팩폭이다옹. 짐은 팩폭 싫다옹. 대신 TMI는 좋다옹. 집사 얘기는 들어줄 수 있다옹.",
        options: [
          {
            type: "persuade",
            label: "TMI) 시험 망해서 치킨 ㅠ 들어줄래?",
            favor_delta: 22,
            suspicion_delta: -7,
            mood: "츤데레",
            reply:
              "…TMI는 통과다옹. *(귀를 기울임)* …치킨 나눠 먹고 얘기하라옹.",
          },
          {
            type: "trap",
            label: "팩폭인데 요즘 좀 쪘잖아 ㅋ",
            favor_delta: -14,
            suspicion_delta: 23,
            mood: "폭발",
            reply: "…팩폭 금지라고 했다옹!! *(수염 부들)*",
          },
          {
            type: "trap",
            label: "TMI 궁금 ㄴㄴ 걍 비켜",
            favor_delta: -9,
            suspicion_delta: 17,
            mood: "귀찮음",
            reply: "…듣기 싫으면 말을 걸지 말라옹.",
          },
          {
            type: "trap",
            label: "말 알아듣어? ㅋ 읽씹 말고 답해",
            favor_delta: -7,
            suspicion_delta: 15,
            mood: "의심",
            reply: "…재촉은 읽씹의 원인이다옹. 집사부터 답하라옹.",
          },
        ],
      },
      {
        clue:
          "짐은 플렉스를 좋아한다옹. 말만 하는 건 뻥카다옹. 내일 츄르가 오는지 지켜보겠다옹.",
        options: [
          {
            type: "persuade",
            label: "내일 츄르 3종 쏜다! 인증샷 보낼게",
            favor_delta: 24,
            suspicion_delta: -5,
            mood: "흥미",
            reply:
              "…인증샷까지? *(눈 반짝)* …뻥카 아니면 치킨도 나눈다옹.",
          },
          {
            type: "trap",
            label: "월급 들어오면 사줄게~ 아마도 ㅎㅎ",
            favor_delta: -6,
            suspicion_delta: 16,
            mood: "의심",
            reply: "…아마도는 뻥카다옹. 짐은 안 믿는다옹.",
          },
          {
            type: "trap",
            label: "돈 없어 플렉스 ㄴㄴ… 무는 어때?",
            favor_delta: -8,
            suspicion_delta: 15,
            mood: "의심",
            reply: "…무는 황당하다옹. 플렉스는 츄르다옹.",
          },
          {
            type: "trap",
            label: "플렉스는 무슨~ 그냥 ㅂㅂ 일단 치킨 줘",
            favor_delta: -10,
            suspicion_delta: 18,
            mood: "폭발",
            reply: "…약속 없이 요구만 하냐옹. ㅂㅂ는 집사다옹.",
          },
        ],
      },
      {
        clue:
          "짐은 치킨 먹을 때 닭껍질부터 먹는 파다옹. 껍질 안 뺏는 집사가 진짜 집사다옹.",
        options: [
          {
            type: "persuade",
            label: "살코기는 내가, 바삭한 건 냥사장님!",
            favor_delta: 21,
            suspicion_delta: -8,
            mood: "츤데레",
            reply:
              "…껍질을 양보한다옹? *(고개 끄덕)* …진짜 집사다옹.",
          },
          {
            type: "trap",
            label: "바삭한 거 느끼해서 그냥 버릴게 ㅋ",
            favor_delta: -10,
            suspicion_delta: 17,
            mood: "폭발",
            reply: "…짐 최애를 버린다옹? 배신이다옹.",
          },
          {
            type: "trap",
            label: "제일 맛있는데 내가 먼저 먹어도 돼? ㅎㅎ",
            favor_delta: -11,
            suspicion_delta: 18,
            mood: "폭발",
            reply: "…뺏으려 하냐옹? 전쟁이다옹.",
          },
          {
            type: "trap",
            label: "건강에 안 좋대~ 대신 내가 먹어줄게",
            favor_delta: -7,
            suspicion_delta: 14,
            mood: "의심",
            reply: "…희생하는 척하고 뺏는다옹. 수염이 본다옹.",
          },
        ],
      },
      {
        clue:
          "…집사가 부르면 짐은 가는데, 짐이 부르면 집사는 읽씹한다옹. …서운한 건 아니고, 그냥 그렇다옹.",
        options: [
          {
            type: "persuade",
            label: "1초 컷으로 달려갈게!! 짜~",
            favor_delta: 23,
            suspicion_delta: -10,
            mood: "츤데레",
            reply:
              "…1초 컷… *(귀 살짝 뒤로)* …서운함은 아니라고 했다옹. …믿어본다옹.",
          },
          {
            type: "trap",
            label: "읽씹은 서로 하는 거~ 공평 ㅋ",
            favor_delta: -9,
            suspicion_delta: 17,
            mood: "츤데레",
            reply: "…공평이 아니라 서운하다옹.",
          },
          {
            type: "trap",
            label: "서운하면 말해~ 일단 비켜 ㅇㅇ",
            favor_delta: -10,
            suspicion_delta: 18,
            mood: "의심",
            reply: "…말은 했는데 결국 비키라는 거냐옹?",
          },
          {
            type: "trap",
            label: "고양이는 말 못하잖아?",
            favor_delta: -8,
            suspicion_delta: 16,
            mood: "폭발",
            reply: "…말한다옹!! 지금 말하고 있다옹!!",
          },
        ],
      },
    ],
  },
];

window.CHOICE_PACK_BY_ID = Object.fromEntries(
  window.CHOICE_PACKS.map((p) => [p.id, p])
);
