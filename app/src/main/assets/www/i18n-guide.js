'use strict';
/* Chuỗi cho màn hình Hướng dẫn sử dụng (8 ngôn ngữ). Gộp vào window.I18N.T. */
(() => {
  const G = {
    vi: {
      guideBtn: 'Hướng dẫn sử dụng', guideSkip: 'Bỏ qua', guideNext: 'Tiếp', guideDone: 'Bắt đầu',
      guideT1: 'Chào mừng đến với VocabLuxe', guideX1: 'Học từ vựng tiếng Anh và tiếng Trung (HSK) theo chủ đề. Chọn ngôn ngữ muốn học ở phía trên, rồi bấm nút menu để chọn chủ đề.',
      guideT2: 'Tìm đúng từ cần học', guideX2: 'Tìm theo từ, nghĩa hoặc phiên âm. Dùng các thẻ Tất cả / Chưa thuộc / Đã thuộc / Yêu thích để lọc, và nút cấp độ để lọc theo trình độ CEFR hoặc HSK.',
      guideT3: 'Nghe và chuyển từ', guideX3: 'Bấm vào một từ để mở — phát âm sẽ phát ngay. Dùng nút Nghe và Nghe chậm để nghe lại, vuốt trái hoặc phải để chuyển từ.',
      guideT4: 'Nghĩa và ngữ cảnh', guideX4: 'Xem nghĩa và câu ví dụ thực tế kèm bản dịch. Bật Ôn tập để ẩn nghĩa, rồi bấm Hiện đáp án khi bạn sẵn sàng.',
      guideT5: 'Theo dõi tiến độ', guideX5: 'Đánh dấu từ Đã thuộc hoặc Yêu thích. Luyện tập chọn ngẫu nhiên tối đa 10 từ đã thuộc và ẩn nghĩa để bạn tự kiểm tra.',
      guideT6: 'Tùy chỉnh theo ý bạn', guideX6: 'Trong menu, bạn có thể đổi ngôn ngữ ứng dụng, xem giấy phép và chính sách quyền riêng tư, hoặc mở lại hướng dẫn này bất cứ lúc nào. Nút mặt trời / mặt trăng đổi giao diện sáng hoặc tối.',
    },
    en: {
      guideBtn: 'How to use', guideSkip: 'Skip', guideNext: 'Next', guideDone: 'Get started',
      guideT1: 'Welcome to VocabLuxe', guideX1: 'Learn English and Chinese (HSK) vocabulary by topic. Pick the language to learn at the top, then open the menu button to choose a topic.',
      guideT2: 'Find the right words', guideX2: 'Search by word, meaning or pronunciation. Use the tabs to show all, not-learned, learned or favorite words, and the level button to filter by CEFR or HSK level.',
      guideT3: 'Listen and browse', guideX3: 'Tap a word to open it — the pronunciation plays right away. Use Listen and Slow to hear it again, and swipe left or right to move between words.',
      guideT4: 'Meaning and context', guideX4: 'See the meaning and a real example sentence with its translation. Turn on Review to hide meanings, then tap Show answer when you are ready.',
      guideT5: 'Track your progress', guideX5: 'Mark words as Learned or Favorite. Practice picks up to 10 random learned words and hides their meanings so you can test yourself.',
      guideT6: 'Make it yours', guideX6: 'In the menu you can change the app language, read the licenses and privacy policy, or reopen this guide any time. The sun/moon button switches between light and dark theme.',
    },
    zh: {
      guideBtn: '使用指南', guideSkip: '跳过', guideNext: '下一步', guideDone: '开始使用',
      guideT1: '欢迎使用 VocabLuxe', guideX1: '按主题学习英语和汉语（HSK）词汇。先在顶部选择要学习的语言，再点击菜单按钮选择主题。',
      guideT2: '快速找到单词', guideX2: '可按单词、释义或发音搜索。用标签筛选全部、未掌握、已掌握或收藏的单词，用级别按钮按 CEFR 或 HSK 级别筛选。',
      guideT3: '听发音与切换单词', guideX3: '点击单词即可打开，发音会立即播放。可用“听发音”和“慢速”再听一遍，左右滑动切换单词。',
      guideT4: '释义与语境', guideX4: '查看释义和真实例句及其翻译。开启“复习”可隐藏释义，准备好后点击“显示答案”。',
      guideT5: '跟踪学习进度', guideX5: '将单词标记为“已掌握”或“收藏”。“练习”会随机抽取最多 10 个已掌握的单词并隐藏释义，供你自测。',
      guideT6: '个性化设置', guideX6: '在菜单中可更改应用语言、查看许可与隐私政策，或随时重新打开本指南。太阳/月亮按钮可切换浅色或深色主题。',
    },
    es: {
      guideBtn: 'Cómo usar la app', guideSkip: 'Omitir', guideNext: 'Siguiente', guideDone: 'Empezar',
      guideT1: 'Bienvenido a VocabLuxe', guideX1: 'Aprende vocabulario de inglés y chino (HSK) por temas. Elige arriba el idioma que quieres aprender y pulsa el botón de menú para elegir un tema.',
      guideT2: 'Encuentra las palabras', guideX2: 'Busca por palabra, significado o pronunciación. Usa las pestañas para ver todas, por aprender, aprendidas o favoritas, y el botón de nivel para filtrar por nivel CEFR o HSK.',
      guideT3: 'Escucha y avanza', guideX3: 'Toca una palabra para abrirla: la pronunciación suena al instante. Usa Escuchar y Lento para repetirla y desliza a izquierda o derecha para cambiar de palabra.',
      guideT4: 'Significado y contexto', guideX4: 'Consulta el significado y una frase de ejemplo real con su traducción. Activa Repaso para ocultar los significados y pulsa Mostrar respuesta cuando estés listo.',
      guideT5: 'Sigue tu progreso', guideX5: 'Marca las palabras como Aprendidas o Favoritas. Practicar elige hasta 10 palabras aprendidas al azar y oculta su significado para que te pongas a prueba.',
      guideT6: 'Personalízala', guideX6: 'En el menú puedes cambiar el idioma de la app, leer las licencias y la política de privacidad, o volver a abrir esta guía cuando quieras. El botón de sol/luna cambia entre tema claro y oscuro.',
    },
    pt: {
      guideBtn: 'Como usar o app', guideSkip: 'Pular', guideNext: 'Avançar', guideDone: 'Começar',
      guideT1: 'Bem-vindo ao VocabLuxe', guideX1: 'Aprenda vocabulário de inglês e chinês (HSK) por temas. Escolha acima o idioma que quer aprender e toque no botão de menu para escolher um tema.',
      guideT2: 'Encontre as palavras', guideX2: 'Busque por palavra, significado ou pronúncia. Use as abas para ver todas, a aprender, aprendidas ou favoritas, e o botão de nível para filtrar por nível CEFR ou HSK.',
      guideT3: 'Ouça e navegue', guideX3: 'Toque em uma palavra para abri-la: a pronúncia toca na hora. Use Ouvir e Devagar para repetir e deslize para a esquerda ou direita para trocar de palavra.',
      guideT4: 'Significado e contexto', guideX4: 'Veja o significado e uma frase de exemplo real com tradução. Ative Revisão para ocultar os significados e toque em Mostrar resposta quando estiver pronto.',
      guideT5: 'Acompanhe seu progresso', guideX5: 'Marque as palavras como Aprendidas ou Favoritas. Praticar escolhe até 10 palavras aprendidas aleatórias e oculta o significado para você se testar.',
      guideT6: 'Deixe do seu jeito', guideX6: 'No menu, você pode mudar o idioma do app, ler as licenças e a política de privacidade ou reabrir este guia quando quiser. O botão de sol/lua alterna entre tema claro e escuro.',
    },
    ru: {
      guideBtn: 'Как пользоваться', guideSkip: 'Пропустить', guideNext: 'Далее', guideDone: 'Начать',
      guideT1: 'Добро пожаловать в VocabLuxe', guideX1: 'Учите английские и китайские (HSK) слова по темам. Выберите язык обучения вверху, затем нажмите кнопку меню и выберите тему.',
      guideT2: 'Найдите нужные слова', guideX2: 'Ищите по слову, значению или произношению. Вкладки показывают все, невыученные, выученные или избранные слова, а кнопка уровня фильтрует по уровню CEFR или HSK.',
      guideT3: 'Слушайте и листайте', guideX3: 'Нажмите на слово, чтобы открыть его — произношение зазвучит сразу. Кнопки «Слушать» и «Медленно» повторят его, а свайп влево или вправо переключает слова.',
      guideT4: 'Значение и контекст', guideX4: 'Смотрите значение и реальный пример предложения с переводом. Включите «Повторение», чтобы скрыть значения, и нажмите «Показать ответ», когда будете готовы.',
      guideT5: 'Следите за прогрессом', guideX5: 'Отмечайте слова как выученные или избранные. «Практика» выбирает до 10 случайных выученных слов и скрывает их значения, чтобы вы могли проверить себя.',
      guideT6: 'Настройте под себя', guideX6: 'В меню можно сменить язык приложения, прочитать лицензии и политику конфиденциальности или снова открыть это руководство. Кнопка солнца/луны переключает светлую и тёмную тему.',
    },
    ja: {
      guideBtn: '使い方', guideSkip: 'スキップ', guideNext: '次へ', guideDone: '始める',
      guideT1: 'VocabLuxe へようこそ', guideX1: '英語と中国語（HSK）の語彙をトピック別に学べます。上部で学ぶ言語を選び、メニューボタンからトピックを選びましょう。',
      guideT2: '単語を探す', guideX2: '単語・意味・発音で検索できます。タブで「すべて」「未習得」「習得済み」「お気に入り」を切り替え、レベルボタンで CEFR や HSK のレベルを絞り込めます。',
      guideT3: '聞いて、めくる', guideX3: '単語をタップすると開き、すぐに発音が流れます。「発音を聞く」「ゆっくり」でもう一度聞け、左右にスワイプで単語を切り替えられます。',
      guideT4: '意味と用例', guideX4: '意味と、翻訳付きの実際の例文を確認できます。「復習」をオンにすると意味が隠れ、準備ができたら「答えを表示」をタップします。',
      guideT5: '進捗を記録', guideX5: '単語を「習得済み」や「お気に入り」にできます。「練習」は習得済みの単語から最大10語をランダムに選び、意味を隠してセルフテストできます。',
      guideT6: '自分好みに設定', guideX6: 'メニューからアプリの言語変更、ライセンスとプライバシーポリシーの確認、この使い方の再表示ができます。太陽/月ボタンでライト/ダークテーマを切り替えます。',
    },
    ko: {
      guideBtn: '사용 방법', guideSkip: '건너뛰기', guideNext: '다음', guideDone: '시작하기',
      guideT1: 'VocabLuxe에 오신 것을 환영합니다', guideX1: '영어와 중국어(HSK) 어휘를 주제별로 배워 보세요. 위에서 배울 언어를 고르고 메뉴 버튼으로 주제를 선택하세요.',
      guideT2: '단어 찾기', guideX2: '단어, 뜻, 발음으로 검색할 수 있습니다. 탭으로 전체, 미암기, 암기 완료, 즐겨찾기를 보고 레벨 버튼으로 CEFR 또는 HSK 레벨을 필터링하세요.',
      guideT3: '듣고 넘기기', guideX3: '단어를 누르면 열리고 발음이 바로 재생됩니다. "발음 듣기"와 "천천히"로 다시 듣고, 좌우로 밀어 단어를 이동하세요.',
      guideT4: '뜻과 용례', guideX4: '뜻과 번역이 있는 실제 예문을 확인하세요. "복습"을 켜면 뜻이 숨겨지고, 준비되면 "정답 보기"를 누르세요.',
      guideT5: '진행 상황 확인', guideX5: '단어를 "암기 완료"나 "즐겨찾기"로 표시하세요. "연습"은 암기한 단어 중 최대 10개를 무작위로 골라 뜻을 숨겨 스스로 테스트할 수 있게 합니다.',
      guideT6: '나에게 맞게 설정', guideX6: '메뉴에서 앱 언어를 바꾸고, 라이선스와 개인정보 처리방침을 보거나, 이 안내를 언제든 다시 열 수 있습니다. 해/달 버튼으로 라이트·다크 테마를 전환합니다.',
    },
  };
  for (const l of Object.keys(G)) Object.assign(window.I18N.T[l], G[l]);
})();
