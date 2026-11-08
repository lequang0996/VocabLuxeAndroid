'use strict';
/* VocabLuxe – đa ngôn ngữ giao diện: vi, en, zh, es, pt, ru, ja, ko.
   Chứa: chuỗi giao diện (T), tên chủ đề (TOPIC), tên loại từ (POS), tên các ngôn ngữ (NAMES) và nội dung giấy phép (LEGAL). */
window.I18N = (() => {
  const codes = ['vi', 'en', 'zh', 'es', 'pt', 'ru', 'ja', 'ko'];
  const FLAG = { vi: '🇻🇳', en: '🇬🇧', zh: '🇨🇳', es: '🇪🇸', pt: '🇧🇷', ru: '🇷🇺', ja: '🇯🇵', ko: '🇰🇷' };
  const NATIVE = { vi: 'Tiếng Việt', en: 'English', zh: '简体中文', es: 'Español', pt: 'Português (Brasil)', ru: 'Русский', ja: '日本語', ko: '한국어' };
  /* Thứ tự hiển thị trong menu ngôn ngữ */
  const ORDER = ['en', 'zh', 'es', 'pt', 'ru', 'ja', 'ko', 'vi'];
  /* Mã ngôn ngữ dùng cho định dạng số */
  const LOC = { vi: 'vi-VN', en: 'en-US', zh: 'zh-CN', es: 'es-ES', pt: 'pt-BR', ru: 'ru-RU', ja: 'ja-JP', ko: 'ko-KR' };

  /* Tên của từng ngôn ngữ, viết bằng ngôn ngữ giao diện đang chọn */
  const NAMES = {
    vi: { en: 'Tiếng Anh', zh: 'Tiếng Trung, giản thể', es: 'Tiếng Tây Ban Nha', pt: 'Tiếng Bồ Đào Nha, Brazil', ru: 'Tiếng Nga', ja: 'Tiếng Nhật', ko: 'Tiếng Hàn', vi: 'Tiếng Việt' },
    en: { en: 'English', zh: 'Chinese, Simplified', es: 'Spanish', pt: 'Portuguese, Brazil', ru: 'Russian', ja: 'Japanese', ko: 'Korean', vi: 'Vietnamese' },
    zh: { en: '英语', zh: '简体中文', es: '西班牙语', pt: '葡萄牙语（巴西）', ru: '俄语', ja: '日语', ko: '韩语', vi: '越南语' },
    es: { en: 'Inglés', zh: 'Chino simplificado', es: 'Español', pt: 'Portugués de Brasil', ru: 'Ruso', ja: 'Japonés', ko: 'Coreano', vi: 'Vietnamita' },
    pt: { en: 'Inglês', zh: 'Chinês simplificado', es: 'Espanhol', pt: 'Português do Brasil', ru: 'Russo', ja: 'Japonês', ko: 'Coreano', vi: 'Vietnamita' },
    ru: { en: 'Английский', zh: 'Китайский (упрощённый)', es: 'Испанский', pt: 'Португальский (Бразилия)', ru: 'Русский', ja: 'Японский', ko: 'Корейский', vi: 'Вьетнамский' },
    ja: { en: '英語', zh: '中国語（簡体字）', es: 'スペイン語', pt: 'ポルトガル語（ブラジル）', ru: 'ロシア語', ja: '日本語', ko: '韓国語', vi: 'ベトナム語' },
    ko: { en: '영어', zh: '중국어(간체)', es: '스페인어', pt: '포르투갈어(브라질)', ru: '러시아어', ja: '일본어', ko: '한국어', vi: '베트남어' },
  };

  /* ------------------------------------------------------------------ */
  /*  Chuỗi giao diện                                                    */
  /* ------------------------------------------------------------------ */
  const T = {
    vi: {
      menu: 'Menu',
      brandSub: 'Từ vựng Anh · Trung', topics: 'Chủ đề', langBtn: 'Ngôn ngữ', licenseBtn: 'Giấy phép', privacyLink: 'Quyền riêng tư',
      openTopics: 'Mở danh sách chủ đề', toLight: 'Chuyển sang giao diện sáng', toDark: 'Chuyển sang giao diện tối',
      searchPh: 'Tìm từ, nghĩa, phiên âm…', clearSearch: 'Xóa từ khóa',
      fAll: 'Tất cả', fTodo: 'Chưa thuộc', fDone: 'Đã thuộc', fFav: 'Yêu thích',
      chooseLevel: 'Chọn cấp độ', allLevels: 'Mọi cấp', practice: 'Luyện tập', back: 'Quay lại',
      listen: 'Nghe phát âm', slow: 'Nghe chậm', autoPlay: 'Tự phát âm', reviewMode: 'Ôn tập (ẩn nghĩa)',
      swipeHint: 'Vuốt trái / phải để chuyển từ', meaning: 'Nghĩa', reveal: 'Hiện đáp án', context: 'Ngữ cảnh',
      listenEx: 'Nghe câu ví dụ', srcPrefix: 'Nguồn', prev: 'Từ trước', next: 'Từ tiếp theo',
      markLearn: 'Thuộc rồi', learned: 'Đã thuộc', favorite: 'Yêu thích', allTopics: 'Tất cả chủ đề', topic: 'Chủ đề',
      wordsN: '{n} từ', statsFmt: 'Đã thuộc {n} / {total} từ · {p}%', practiceSub: '{n} / {m} từ đã thuộc · nghĩa ẩn',
      noLearned: 'Chưa có từ nào đánh dấu "Đã thuộc" để luyện tập.',
      emptyA: 'Không có từ nào khớp bộ lọc.', emptyB: 'Thử bỏ bớt bộ lọc hoặc đổi từ khóa.',
      loadingData: 'Đang mở dữ liệu {lang}…', loadFail: 'Không mở được dữ liệu {lang}: {err}',
      ttsFail: 'Không phát được âm thanh.', ttsNone: 'Thiết bị không hỗ trợ phát âm.',
      ttsMissing: 'Máy chưa có giọng đọc {lang}. Vào Cài đặt > Chuyển văn bản thành giọng nói để tải thêm.',
      ttsInit: 'Không khởi động được bộ đọc giọng của máy.', ttsBrowser: 'Không mở được trình duyệt.',
      autoTrans: 'Nghĩa dịch tự động', hv: 'Âm Hán Việt', noMeaning: 'Không tải được nghĩa.',
      reason: 'Lý do: {err}   —   Kiểm tra mạng rồi chọn lại từ.', noService: 'không kết nối được dịch vụ dịch',
      lookingMeaning: 'Đang tra nghĩa…', exFail: 'Không tải được ví dụ (mất kết nối).',
      exNone: 'Chưa tìm thấy ngữ cảnh cho từ này.', exLoading: 'Đang tìm ngữ cảnh…', enPrefix: '(Tiếng Anh)',
      updDone: 'Đã tải xong bản cập nhật.', updRestart: 'Khởi động lại', language: 'Ngôn ngữ',
      legalTitle: 'Giấy phép', lang_en: 'Tiếng Anh', lang_zh: 'Tiếng Trung',
    },
    en: {
      menu: 'Menu',
      brandSub: 'English · Chinese vocabulary', topics: 'Topics', langBtn: 'Language', licenseBtn: 'Licenses', privacyLink: 'Privacy Policy',
      openTopics: 'Open topic list', toLight: 'Switch to light theme', toDark: 'Switch to dark theme',
      searchPh: 'Search words, meanings, pronunciation…', clearSearch: 'Clear search',
      fAll: 'All', fTodo: 'Not learned', fDone: 'Learned', fFav: 'Favorites',
      chooseLevel: 'Choose level', allLevels: 'All levels', practice: 'Practice', back: 'Back',
      listen: 'Listen', slow: 'Slow', autoPlay: 'Auto-play', reviewMode: 'Review (hide meaning)',
      swipeHint: 'Swipe left / right to change word', meaning: 'Meaning', reveal: 'Show answer', context: 'Context',
      listenEx: 'Play example sentence', srcPrefix: 'Sources', prev: 'Previous word', next: 'Next word',
      markLearn: 'Mark learned', learned: 'Learned', favorite: 'Favorite', allTopics: 'All topics', topic: 'Topic',
      wordsN: '{n} words', statsFmt: 'Learned {n} / {total} words · {p}%', practiceSub: '{n} / {m} learned words · meaning hidden',
      noLearned: 'No words are marked “Learned” yet.',
      emptyA: 'No words match the filters.', emptyB: 'Try removing a filter or changing the keyword.',
      loadingData: 'Opening {lang} data…', loadFail: 'Could not open {lang} data: {err}',
      ttsFail: 'Could not play audio.', ttsNone: 'This device does not support speech.',
      ttsMissing: 'This device has no {lang} voice. Go to Settings > Text-to-speech to download one.',
      ttsInit: 'Could not start the device’s speech engine.', ttsBrowser: 'Could not open the browser.',
      autoTrans: 'Automatic translation', hv: '', noMeaning: 'Could not load the meaning.',
      reason: 'Reason: {err}   —   Check your connection and select the word again.', noService: 'the translation service is unreachable',
      lookingMeaning: 'Looking up meaning…', exFail: 'Could not load the example (offline).',
      exNone: 'No context found for this word.', exLoading: 'Finding context…', enPrefix: '(English)',
      updDone: 'An update has been downloaded.', updRestart: 'Restart', language: 'Language',
      legalTitle: 'Licenses', lang_en: 'English', lang_zh: 'Chinese',
    },
    zh: {
      menu: '菜单',
      brandSub: '英语 · 汉语词汇', topics: '主题', langBtn: '语言', licenseBtn: '许可', privacyLink: '隐私政策',
      openTopics: '打开主题列表', toLight: '切换到浅色主题', toDark: '切换到深色主题',
      searchPh: '搜索单词、释义、拼音…', clearSearch: '清除搜索',
      fAll: '全部', fTodo: '未掌握', fDone: '已掌握', fFav: '收藏',
      chooseLevel: '选择级别', allLevels: '所有级别', practice: '练习', back: '返回',
      listen: '听发音', slow: '慢速', autoPlay: '自动发音', reviewMode: '复习（隐藏释义）',
      swipeHint: '左右滑动切换单词', meaning: '释义', reveal: '显示答案', context: '语境',
      listenEx: '播放例句', srcPrefix: '来源', prev: '上一个单词', next: '下一个单词',
      markLearn: '标记已掌握', learned: '已掌握', favorite: '收藏', allTopics: '全部主题', topic: '主题',
      wordsN: '{n} 个词', statsFmt: '已掌握 {n} / {total} 个词 · {p}%', practiceSub: '{n} / {m} 个已掌握单词 · 释义已隐藏',
      noLearned: '还没有标记为“已掌握”的单词，无法练习。',
      emptyA: '没有符合筛选条件的单词。', emptyB: '请尝试取消部分筛选或更换关键词。',
      loadingData: '正在打开{lang}数据…', loadFail: '无法打开{lang}数据：{err}',
      ttsFail: '无法播放音频。', ttsNone: '此设备不支持语音朗读。',
      ttsMissing: '此设备没有{lang}语音。请前往“设置 > 文字转语音”下载。',
      ttsInit: '无法启动设备的语音引擎。', ttsBrowser: '无法打开浏览器。',
      autoTrans: '自动翻译', hv: '', noMeaning: '无法加载释义。',
      reason: '原因：{err}   —   请检查网络后重新选择该单词。', noService: '无法连接翻译服务',
      lookingMeaning: '正在查询释义…', exFail: '无法加载例句（网络中断）。',
      exNone: '暂未找到该词的语境。', exLoading: '正在查找语境…', enPrefix: '（英文）',
      updDone: '更新已下载完成。', updRestart: '重新启动', language: '语言',
      legalTitle: '许可', lang_en: '英语', lang_zh: '中文',
    },
    es: {
      menu: 'Menú',
      brandSub: 'Vocabulario de inglés y chino', topics: 'Temas', langBtn: 'Idioma', licenseBtn: 'Licencias', privacyLink: 'Privacidad',
      openTopics: 'Abrir lista de temas', toLight: 'Cambiar al tema claro', toDark: 'Cambiar al tema oscuro',
      searchPh: 'Buscar palabra, significado, pronunciación…', clearSearch: 'Borrar búsqueda',
      fAll: 'Todas', fTodo: 'Por aprender', fDone: 'Aprendidas', fFav: 'Favoritas',
      chooseLevel: 'Elegir nivel', allLevels: 'Todos los niveles', practice: 'Practicar', back: 'Volver',
      listen: 'Escuchar', slow: 'Lento', autoPlay: 'Reproducir automáticamente', reviewMode: 'Repaso (ocultar significado)',
      swipeHint: 'Desliza a izquierda o derecha para cambiar de palabra', meaning: 'Significado', reveal: 'Mostrar respuesta', context: 'Contexto',
      listenEx: 'Escuchar la frase de ejemplo', srcPrefix: 'Fuentes', prev: 'Palabra anterior', next: 'Palabra siguiente',
      markLearn: 'Marcar como aprendida', learned: 'Aprendida', favorite: 'Favorita', allTopics: 'Todos los temas', topic: 'Tema',
      wordsN: '{n} palabras', statsFmt: 'Aprendidas {n} / {total} palabras · {p}%', practiceSub: '{n} / {m} palabras aprendidas · significado oculto',
      noLearned: 'Aún no hay palabras marcadas como «Aprendida» para practicar.',
      emptyA: 'Ninguna palabra coincide con los filtros.', emptyB: 'Prueba a quitar algún filtro o cambiar la palabra clave.',
      loadingData: 'Abriendo datos de {lang}…', loadFail: 'No se pudieron abrir los datos de {lang}: {err}',
      ttsFail: 'No se pudo reproducir el audio.', ttsNone: 'Este dispositivo no admite la lectura en voz alta.',
      ttsMissing: 'Este dispositivo no tiene voz de {lang}. Ve a Ajustes > Texto a voz para descargarla.',
      ttsInit: 'No se pudo iniciar el motor de voz del dispositivo.', ttsBrowser: 'No se pudo abrir el navegador.',
      autoTrans: 'Traducción automática', hv: '', noMeaning: 'No se pudo cargar el significado.',
      reason: 'Motivo: {err}   —   Comprueba la conexión y vuelve a seleccionar la palabra.', noService: 'no se puede conectar con el servicio de traducción',
      lookingMeaning: 'Buscando significado…', exFail: 'No se pudo cargar el ejemplo (sin conexión).',
      exNone: 'No se encontró contexto para esta palabra.', exLoading: 'Buscando contexto…', enPrefix: '(Inglés)',
      updDone: 'Se ha descargado una actualización.', updRestart: 'Reiniciar', language: 'Idioma',
      legalTitle: 'Licencias', lang_en: 'Inglés', lang_zh: 'Chino',
    },
    pt: {
      menu: 'Menu',
      brandSub: 'Vocabulário de inglês e chinês', topics: 'Temas', langBtn: 'Idioma', licenseBtn: 'Licenças', privacyLink: 'Privacidade',
      openTopics: 'Abrir lista de temas', toLight: 'Mudar para o tema claro', toDark: 'Mudar para o tema escuro',
      searchPh: 'Buscar palavra, significado, pronúncia…', clearSearch: 'Limpar busca',
      fAll: 'Todas', fTodo: 'A aprender', fDone: 'Aprendidas', fFav: 'Favoritas',
      chooseLevel: 'Escolher nível', allLevels: 'Todos os níveis', practice: 'Praticar', back: 'Voltar',
      listen: 'Ouvir', slow: 'Devagar', autoPlay: 'Reproduzir automaticamente', reviewMode: 'Revisão (ocultar significado)',
      swipeHint: 'Deslize para a esquerda ou direita para trocar de palavra', meaning: 'Significado', reveal: 'Mostrar resposta', context: 'Contexto',
      listenEx: 'Ouvir a frase de exemplo', srcPrefix: 'Fontes', prev: 'Palavra anterior', next: 'Próxima palavra',
      markLearn: 'Marcar como aprendida', learned: 'Aprendida', favorite: 'Favorita', allTopics: 'Todos os temas', topic: 'Tema',
      wordsN: '{n} palavras', statsFmt: 'Aprendidas {n} / {total} palavras · {p}%', practiceSub: '{n} / {m} palavras aprendidas · significado oculto',
      noLearned: 'Ainda não há palavras marcadas como “Aprendida” para praticar.',
      emptyA: 'Nenhuma palavra corresponde aos filtros.', emptyB: 'Tente remover algum filtro ou mudar a palavra-chave.',
      loadingData: 'Abrindo dados de {lang}…', loadFail: 'Não foi possível abrir os dados de {lang}: {err}',
      ttsFail: 'Não foi possível reproduzir o áudio.', ttsNone: 'Este dispositivo não oferece leitura em voz alta.',
      ttsMissing: 'Este dispositivo não tem voz de {lang}. Vá em Configurações > Conversão de texto em voz para baixar.',
      ttsInit: 'Não foi possível iniciar o mecanismo de voz do dispositivo.', ttsBrowser: 'Não foi possível abrir o navegador.',
      autoTrans: 'Tradução automática', hv: '', noMeaning: 'Não foi possível carregar o significado.',
      reason: 'Motivo: {err}   —   Verifique a conexão e selecione a palavra novamente.', noService: 'não foi possível conectar ao serviço de tradução',
      lookingMeaning: 'Buscando significado…', exFail: 'Não foi possível carregar o exemplo (sem conexão).',
      exNone: 'Nenhum contexto encontrado para esta palavra.', exLoading: 'Procurando contexto…', enPrefix: '(Inglês)',
      updDone: 'Uma atualização foi baixada.', updRestart: 'Reiniciar', language: 'Idioma',
      legalTitle: 'Licenças', lang_en: 'Inglês', lang_zh: 'Chinês',
    },
    ru: {
      menu: 'Меню',
      brandSub: 'Словарный запас: английский · китайский', topics: 'Темы', langBtn: 'Язык', licenseBtn: 'Лицензии', privacyLink: 'Конфиденциальность',
      openTopics: 'Открыть список тем', toLight: 'Переключить на светлую тему', toDark: 'Переключить на тёмную тему',
      searchPh: 'Поиск слова, значения, произношения…', clearSearch: 'Очистить поиск',
      fAll: 'Все', fTodo: 'Не выучены', fDone: 'Выучены', fFav: 'Избранное',
      chooseLevel: 'Выбрать уровень', allLevels: 'Все уровни', practice: 'Практика', back: 'Назад',
      listen: 'Слушать', slow: 'Медленно', autoPlay: 'Автопроизношение', reviewMode: 'Повторение (скрыть значение)',
      swipeHint: 'Проведите влево или вправо, чтобы сменить слово', meaning: 'Значение', reveal: 'Показать ответ', context: 'Контекст',
      listenEx: 'Прослушать пример', srcPrefix: 'Источники', prev: 'Предыдущее слово', next: 'Следующее слово',
      markLearn: 'Отметить выученным', learned: 'Выучено', favorite: 'В избранное', allTopics: 'Все темы', topic: 'Тема',
      wordsN: 'Слов: {n}', statsFmt: 'Выучено {n} / {total} слов · {p}%', practiceSub: '{n} / {m} выученных слов · значение скрыто',
      noLearned: 'Нет слов, отмеченных как «Выучено», для практики.',
      emptyA: 'Нет слов, подходящих под фильтры.', emptyB: 'Попробуйте убрать фильтр или изменить запрос.',
      loadingData: 'Открываем данные: {lang}…', loadFail: 'Не удалось открыть данные ({lang}): {err}',
      ttsFail: 'Не удалось воспроизвести звук.', ttsNone: 'Это устройство не поддерживает озвучивание.',
      ttsMissing: 'На устройстве нет голоса для языка «{lang}». Откройте Настройки > Синтез речи и загрузите его.',
      ttsInit: 'Не удалось запустить синтезатор речи устройства.', ttsBrowser: 'Не удалось открыть браузер.',
      autoTrans: 'Автоматический перевод', hv: '', noMeaning: 'Не удалось загрузить значение.',
      reason: 'Причина: {err}   —   Проверьте подключение и выберите слово снова.', noService: 'нет связи со службой перевода',
      lookingMeaning: 'Ищем значение…', exFail: 'Не удалось загрузить пример (нет сети).',
      exNone: 'Для этого слова контекст не найден.', exLoading: 'Ищем контекст…', enPrefix: '(Английский)',
      updDone: 'Обновление загружено.', updRestart: 'Перезапустить', language: 'Язык',
      legalTitle: 'Лицензии', lang_en: 'Английский', lang_zh: 'Китайский',
    },
    ja: {
      menu: 'メニュー',
      brandSub: '英語・中国語の語彙', topics: 'トピック', langBtn: '言語', licenseBtn: 'ライセンス', privacyLink: 'プライバシー',
      openTopics: 'トピック一覧を開く', toLight: 'ライトテーマに切り替え', toDark: 'ダークテーマに切り替え',
      searchPh: '単語・意味・発音を検索…', clearSearch: '検索をクリア',
      fAll: 'すべて', fTodo: '未習得', fDone: '習得済み', fFav: 'お気に入り',
      chooseLevel: 'レベルを選択', allLevels: 'すべてのレベル', practice: '練習', back: '戻る',
      listen: '発音を聞く', slow: 'ゆっくり', autoPlay: '自動で発音', reviewMode: '復習（意味を隠す）',
      swipeHint: '左右にスワイプで単語を切り替え', meaning: '意味', reveal: '答えを表示', context: '用例',
      listenEx: '例文を聞く', srcPrefix: '出典', prev: '前の単語', next: '次の単語',
      markLearn: '習得済みにする', learned: '習得済み', favorite: 'お気に入り', allTopics: 'すべてのトピック', topic: 'トピック',
      wordsN: '{n} 語', statsFmt: '習得 {n} / {total} 語 · {p}%', practiceSub: '習得済み {n} / {m} 語 · 意味は非表示',
      noLearned: '「習得済み」の単語がまだないため練習できません。',
      emptyA: '条件に一致する単語がありません。', emptyB: '絞り込みを外すか、キーワードを変えてみてください。',
      loadingData: '{lang}のデータを開いています…', loadFail: '{lang}のデータを開けませんでした：{err}',
      ttsFail: '音声を再生できませんでした。', ttsNone: 'この端末は音声読み上げに対応していません。',
      ttsMissing: 'この端末に{lang}の音声がありません。「設定 > テキスト読み上げ」でダウンロードしてください。',
      ttsInit: '端末の音声合成エンジンを起動できませんでした。', ttsBrowser: 'ブラウザを開けませんでした。',
      autoTrans: '自動翻訳', hv: '', noMeaning: '意味を読み込めませんでした。',
      reason: '理由：{err}   —   接続を確認してもう一度単語を選んでください。', noService: '翻訳サービスに接続できません',
      lookingMeaning: '意味を調べています…', exFail: '例文を読み込めませんでした（オフライン）。',
      exNone: 'この単語の用例は見つかりませんでした。', exLoading: '用例を探しています…', enPrefix: '（英語）',
      updDone: 'アップデートのダウンロードが完了しました。', updRestart: '再起動', language: '言語',
      legalTitle: 'ライセンス', lang_en: '英語', lang_zh: '中国語',
    },
    ko: {
      menu: '메뉴',
      brandSub: '영어 · 중국어 어휘', topics: '주제', langBtn: '언어', licenseBtn: '라이선스', privacyLink: '개인정보',
      openTopics: '주제 목록 열기', toLight: '라이트 테마로 전환', toDark: '다크 테마로 전환',
      searchPh: '단어, 뜻, 발음 검색…', clearSearch: '검색어 지우기',
      fAll: '전체', fTodo: '미암기', fDone: '암기 완료', fFav: '즐겨찾기',
      chooseLevel: '레벨 선택', allLevels: '모든 레벨', practice: '연습', back: '뒤로',
      listen: '발음 듣기', slow: '천천히', autoPlay: '자동 발음', reviewMode: '복습(뜻 숨기기)',
      swipeHint: '좌우로 밀어 단어 이동', meaning: '뜻', reveal: '정답 보기', context: '용례',
      listenEx: '예문 듣기', srcPrefix: '출처', prev: '이전 단어', next: '다음 단어',
      markLearn: '암기 완료로 표시', learned: '암기 완료', favorite: '즐겨찾기', allTopics: '모든 주제', topic: '주제',
      wordsN: '{n}개 단어', statsFmt: '암기 {n} / {total}개 · {p}%', practiceSub: '암기한 단어 {n} / {m}개 · 뜻 숨김',
      noLearned: '연습할 "암기 완료" 단어가 아직 없습니다.',
      emptyA: '필터에 맞는 단어가 없습니다.', emptyB: '필터를 줄이거나 검색어를 바꿔 보세요.',
      loadingData: '{lang} 데이터를 여는 중…', loadFail: '{lang} 데이터를 열 수 없습니다: {err}',
      ttsFail: '소리를 재생할 수 없습니다.', ttsNone: '이 기기는 음성 읽기를 지원하지 않습니다.',
      ttsMissing: '이 기기에 {lang} 음성이 없습니다. 설정 > 텍스트 음성 변환에서 내려받으세요.',
      ttsInit: '기기의 음성 엔진을 시작할 수 없습니다.', ttsBrowser: '브라우저를 열 수 없습니다.',
      autoTrans: '자동 번역', hv: '', noMeaning: '뜻을 불러오지 못했습니다.',
      reason: '원인: {err}   —   네트워크를 확인한 뒤 단어를 다시 선택하세요.', noService: '번역 서비스에 연결할 수 없습니다',
      lookingMeaning: '뜻을 찾는 중…', exFail: '예문을 불러오지 못했습니다(오프라인).',
      exNone: '이 단어의 용례를 찾지 못했습니다.', exLoading: '용례를 찾는 중…', enPrefix: '(영어)',
      updDone: '업데이트 다운로드가 완료되었습니다.', updRestart: '다시 시작', language: '언어',
      legalTitle: '라이선스', lang_en: '영어', lang_zh: '중국어',
    },
  };

  /* ------------------------------------------------------------------ */
  /*  Tên loại từ (dùng cho dòng nghĩa phụ)                              */
  /* ------------------------------------------------------------------ */
  const POS = {
    vi: { noun: 'danh từ', verb: 'động từ', adjective: 'tính từ', adverb: 'trạng từ', preposition: 'giới từ', pronoun: 'đại từ', conjunction: 'liên từ', interjection: 'thán từ', determiner: 'từ hạn định' },
    en: { noun: 'noun', verb: 'verb', adjective: 'adjective', adverb: 'adverb', preposition: 'preposition', pronoun: 'pronoun', conjunction: 'conjunction', interjection: 'interjection', determiner: 'determiner' },
    zh: { noun: '名词', verb: '动词', adjective: '形容词', adverb: '副词', preposition: '介词', pronoun: '代词', conjunction: '连词', interjection: '感叹词', determiner: '限定词' },
    es: { noun: 'sustantivo', verb: 'verbo', adjective: 'adjetivo', adverb: 'adverbio', preposition: 'preposición', pronoun: 'pronombre', conjunction: 'conjunción', interjection: 'interjección', determiner: 'determinante' },
    pt: { noun: 'substantivo', verb: 'verbo', adjective: 'adjetivo', adverb: 'advérbio', preposition: 'preposição', pronoun: 'pronome', conjunction: 'conjunção', interjection: 'interjeição', determiner: 'determinante' },
    ru: { noun: 'существительное', verb: 'глагол', adjective: 'прилагательное', adverb: 'наречие', preposition: 'предлог', pronoun: 'местоимение', conjunction: 'союз', interjection: 'междометие', determiner: 'определитель' },
    ja: { noun: '名詞', verb: '動詞', adjective: '形容詞', adverb: '副詞', preposition: '前置詞', pronoun: '代名詞', conjunction: '接続詞', interjection: '感動詞', determiner: '限定詞' },
    ko: { noun: '명사', verb: '동사', adjective: '형용사', adverb: '부사', preposition: '전치사', pronoun: '대명사', conjunction: '접속사', interjection: '감탄사', determiner: '한정사' },
  };

  /* ------------------------------------------------------------------ */
  /*  Tên chủ đề (khóa = id trong data/topics.json)                      */
  /* ------------------------------------------------------------------ */
  const TOPIC = {
    vi: { family: 'Gia đình & Con người', body: 'Cơ thể & Sức khỏe', food: 'Ăn uống & Nấu nướng', nature: 'Động vật & Thiên nhiên', time: 'Thời gian & Thời tiết', number: 'Số đếm & Số lượng', color: 'Màu sắc, Hình dạng & Kích cỡ', clothes: 'Quần áo & Thời trang', home: 'Nhà cửa & Đồ dùng', travel: 'Giao thông & Du lịch', place: 'Địa điểm & Phương hướng', study: 'Học tập & Giáo dục', work: 'Công việc & Kinh doanh', money: 'Tiền bạc & Tài chính', tech: 'Công nghệ & Truyền thông', leisure: 'Nghệ thuật, Thể thao & Giải trí', feeling: 'Cảm xúc & Tính cách', society: 'Xã hội, Luật pháp & Chính trị', science: 'Khoa học & Môi trường', comm: 'Giao tiếp & Ngôn ngữ', action: 'Hành động & Chuyển động', quality: 'Tính chất & Mô tả', grammar: 'Từ chức năng & Ngữ pháp', idiom: 'Thành ngữ & Cụm cố định', general: 'Khái niệm chung' },
    en: { family: 'People & Family', body: 'Body & Health', food: 'Food & Cooking', nature: 'Animals & Nature', time: 'Time & Weather', number: 'Numbers & Quantity', color: 'Colors, Shapes & Sizes', clothes: 'Clothes & Fashion', home: 'Home & Household', travel: 'Transport & Travel', place: 'Places & Directions', study: 'Study & Education', work: 'Work & Business', money: 'Money & Finance', tech: 'Technology & Media', leisure: 'Arts, Sports & Leisure', feeling: 'Feelings & Personality', society: 'Society, Law & Politics', science: 'Science & Environment', comm: 'Communication & Language', action: 'Actions & Movement', quality: 'Qualities & Description', grammar: 'Function Words & Grammar', idiom: 'Idioms & Set Phrases', general: 'General Concepts' },
    zh: { family: '人物与家庭', body: '身体与健康', food: '饮食与烹饪', nature: '动物与自然', time: '时间与天气', number: '数字与数量', color: '颜色、形状与大小', clothes: '服装与时尚', home: '家居与用品', travel: '交通与旅行', place: '地点与方位', study: '学习与教育', work: '工作与商业', money: '金钱与金融', tech: '科技与传媒', leisure: '艺术、体育与娱乐', feeling: '情感与性格', society: '社会、法律与政治', science: '科学与环境', comm: '交流与语言', action: '动作与运动', quality: '性质与描述', grammar: '功能词与语法', idiom: '成语与固定搭配', general: '一般概念' },
    es: { family: 'Personas y familia', body: 'Cuerpo y salud', food: 'Comida y cocina', nature: 'Animales y naturaleza', time: 'Tiempo y clima', number: 'Números y cantidades', color: 'Colores, formas y tamaños', clothes: 'Ropa y moda', home: 'Hogar y objetos', travel: 'Transporte y viajes', place: 'Lugares y direcciones', study: 'Estudio y educación', work: 'Trabajo y negocios', money: 'Dinero y finanzas', tech: 'Tecnología y medios', leisure: 'Arte, deporte y ocio', feeling: 'Emociones y personalidad', society: 'Sociedad, ley y política', science: 'Ciencia y medio ambiente', comm: 'Comunicación y lengua', action: 'Acciones y movimiento', quality: 'Cualidades y descripción', grammar: 'Palabras funcionales y gramática', idiom: 'Modismos y frases hechas', general: 'Conceptos generales' },
    pt: { family: 'Pessoas e família', body: 'Corpo e saúde', food: 'Comida e culinária', nature: 'Animais e natureza', time: 'Tempo e clima', number: 'Números e quantidades', color: 'Cores, formas e tamanhos', clothes: 'Roupas e moda', home: 'Casa e utensílios', travel: 'Transporte e viagens', place: 'Lugares e direções', study: 'Estudo e educação', work: 'Trabalho e negócios', money: 'Dinheiro e finanças', tech: 'Tecnologia e mídia', leisure: 'Arte, esporte e lazer', feeling: 'Emoções e personalidade', society: 'Sociedade, lei e política', science: 'Ciência e meio ambiente', comm: 'Comunicação e idioma', action: 'Ações e movimento', quality: 'Qualidades e descrição', grammar: 'Palavras funcionais e gramática', idiom: 'Expressões idiomáticas', general: 'Conceitos gerais' },
    ru: { family: 'Люди и семья', body: 'Тело и здоровье', food: 'Еда и кулинария', nature: 'Животные и природа', time: 'Время и погода', number: 'Числа и количество', color: 'Цвета, формы и размеры', clothes: 'Одежда и мода', home: 'Дом и быт', travel: 'Транспорт и путешествия', place: 'Места и направления', study: 'Учёба и образование', work: 'Работа и бизнес', money: 'Деньги и финансы', tech: 'Технологии и медиа', leisure: 'Искусство, спорт и досуг', feeling: 'Чувства и характер', society: 'Общество, право и политика', science: 'Наука и окружающая среда', comm: 'Общение и язык', action: 'Действия и движение', quality: 'Качества и описание', grammar: 'Служебные слова и грамматика', idiom: 'Идиомы и устойчивые выражения', general: 'Общие понятия' },
    ja: { family: '人と家族', body: '体と健康', food: '食事と料理', nature: '動物と自然', time: '時間と天気', number: '数と量', color: '色・形・大きさ', clothes: '衣服とファッション', home: '家と日用品', travel: '交通と旅行', place: '場所と方向', study: '学習と教育', work: '仕事とビジネス', money: 'お金と金融', tech: 'テクノロジーとメディア', leisure: '芸術・スポーツ・娯楽', feeling: '感情と性格', society: '社会・法律・政治', science: '科学と環境', comm: 'コミュニケーションと言語', action: '動作と移動', quality: '性質と描写', grammar: '機能語と文法', idiom: '慣用句と定型表現', general: '一般概念' },
    ko: { family: '사람과 가족', body: '신체와 건강', food: '음식과 요리', nature: '동물과 자연', time: '시간과 날씨', number: '숫자와 수량', color: '색, 모양, 크기', clothes: '의복과 패션', home: '집과 생활용품', travel: '교통과 여행', place: '장소와 방향', study: '학습과 교육', work: '직업과 비즈니스', money: '돈과 금융', tech: '기술과 미디어', leisure: '예술, 스포츠, 여가', feeling: '감정과 성격', society: '사회, 법, 정치', science: '과학과 환경', comm: '의사소통과 언어', action: '행동과 움직임', quality: '성질과 묘사', grammar: '기능어와 문법', idiom: '관용구와 고정 표현', general: '일반 개념' },
  };

  /* ------------------------------------------------------------------ */
  /*  Giấy phép sử dụng, nguồn dữ liệu, quảng cáo, quyền riêng tư        */
  /*  Mỗi mục: h = tiêu đề, p = đoạn văn, li = gạch đầu dòng             */
  /* ------------------------------------------------------------------ */
  /* Giấy phép (chỉ nguồn dữ liệu). Quyền riêng tư mở thẳng trang chính sách trên GitHub Pages. Mỗi mục: h = tiêu đề, p = đoạn văn */
  const LEGAL = {
    vi: { sections: [
      { h: 'Giấy phép', p: [
        'Từ vựng & định nghĩa tiếng Anh: lấy từ Wiktionary / WordNet, sử dụng theo giấy phép Creative Commons Ghi nhận nguồn – Chia sẻ tương tự 4.0 Quốc tế (CC BY-SA 4.0).',
        'Dữ liệu từ điển tiếng Trung: lấy từ CC-CEDICT, sử dụng theo giấy phép Creative Commons Ghi nhận nguồn – Chia sẻ tương tự 4.0 Quốc tế (CC BY-SA 4.0).'] },
    ] },
    en: { sections: [
      { h: 'Licenses', p: [
        'English Vocabulary & Definitions: Sourced from Wiktionary / WordNet, used under the Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0).',
        'Chinese Dictionary Data: Sourced from CC-CEDICT, used under the Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0).'] },
    ] },
    zh: { sections: [
      { h: '许可', p: [
        '英语词汇与释义：来源于 Wiktionary / WordNet，依据知识共享署名-相同方式共享 4.0 国际许可协议（CC BY-SA 4.0）使用。',
        '汉语词典数据：来源于 CC-CEDICT，依据知识共享署名-相同方式共享 4.0 国际许可协议（CC BY-SA 4.0）使用。'] },
    ] },
    es: { sections: [
      { h: 'Licencias', p: [
        'Vocabulario y definiciones en inglés: procedentes de Wiktionary / WordNet, utilizados bajo la licencia Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0).',
        'Datos del diccionario de chino: procedentes de CC-CEDICT, utilizados bajo la licencia Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0).'] },
    ] },
    pt: { sections: [
      { h: 'Licenças', p: [
        'Vocabulário e definições em inglês: obtidos do Wiktionary / WordNet, usados sob a licença Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0).',
        'Dados do dicionário de chinês: obtidos do CC-CEDICT, usados sob a licença Creative Commons Atribuição-CompartilhaIgual 4.0 Internacional (CC BY-SA 4.0).'] },
    ] },
    ru: { sections: [
      { h: 'Лицензии', p: [
        'Английская лексика и определения: источник — Wiktionary / WordNet, используются по лицензии Creative Commons «Attribution-ShareAlike 4.0 International» (CC BY-SA 4.0).',
        'Данные китайского словаря: источник — CC-CEDICT, используются по лицензии Creative Commons «Attribution-ShareAlike 4.0 International» (CC BY-SA 4.0).'] },
    ] },
    ja: { sections: [
      { h: 'ライセンス', p: [
        '英語の語彙と定義：Wiktionary / WordNet を出典とし、クリエイティブ・コモンズ 表示-継承 4.0 国際ライセンス（CC BY-SA 4.0）に基づき使用しています。',
        '中国語辞書データ：CC-CEDICT を出典とし、クリエイティブ・コモンズ 表示-継承 4.0 国際ライセンス（CC BY-SA 4.0）に基づき使用しています。'] },
    ] },
    ko: { sections: [
      { h: '라이선스', p: [
        '영어 어휘 및 정의: Wiktionary / WordNet에서 가져왔으며, 크리에이티브 커먼즈 저작자표시-동일조건변경허락 4.0 국제 라이선스(CC BY-SA 4.0)에 따라 사용합니다.',
        '중국어 사전 데이터: CC-CEDICT에서 가져왔으며, 크리에이티브 커먼즈 저작자표시-동일조건변경허락 4.0 국제 라이선스(CC BY-SA 4.0)에 따라 사용합니다.'] },
    ] },
  };

  return { codes, FLAG, NATIVE, ORDER, LOC, NAMES, T, POS, TOPIC, LEGAL };
})();
