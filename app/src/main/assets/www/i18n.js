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
      brandSub: 'Từ vựng Anh · Trung', topics: 'Chủ đề', langBtn: 'Ngôn ngữ', legalBtn: 'Giấy phép & Quyền riêng tư',
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
      legalTitle: 'Giấy phép & Quyền riêng tư', lang_en: 'Tiếng Anh', lang_zh: 'Tiếng Trung',
    },
    en: {
      brandSub: 'English · Chinese vocabulary', topics: 'Topics', langBtn: 'Language', legalBtn: 'Licenses & Privacy',
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
      legalTitle: 'Licenses & Privacy', lang_en: 'English', lang_zh: 'Chinese',
    },
    zh: {
      brandSub: '英语 · 汉语词汇', topics: '主题', langBtn: '语言', legalBtn: '许可与隐私',
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
      legalTitle: '许可与隐私', lang_en: '英语', lang_zh: '中文',
    },
    es: {
      brandSub: 'Vocabulario de inglés y chino', topics: 'Temas', langBtn: 'Idioma', legalBtn: 'Licencias y privacidad',
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
      legalTitle: 'Licencias y privacidad', lang_en: 'Inglés', lang_zh: 'Chino',
    },
    pt: {
      brandSub: 'Vocabulário de inglês e chinês', topics: 'Temas', langBtn: 'Idioma', legalBtn: 'Licenças e privacidade',
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
      legalTitle: 'Licenças e privacidade', lang_en: 'Inglês', lang_zh: 'Chinês',
    },
    ru: {
      brandSub: 'Словарный запас: английский · китайский', topics: 'Темы', langBtn: 'Язык', legalBtn: 'Лицензии и конфиденциальность',
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
      legalTitle: 'Лицензии и конфиденциальность', lang_en: 'Английский', lang_zh: 'Китайский',
    },
    ja: {
      brandSub: '英語・中国語の語彙', topics: 'トピック', langBtn: '言語', legalBtn: 'ライセンスとプライバシー',
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
      legalTitle: 'ライセンスとプライバシー', lang_en: '英語', lang_zh: '中国語',
    },
    ko: {
      brandSub: '영어 · 중국어 어휘', topics: '주제', langBtn: '언어', legalBtn: '라이선스 및 개인정보',
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
      legalTitle: '라이선스 및 개인정보', lang_en: '영어', lang_zh: '중국어',
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
  const LEGAL = {
    vi: { privacyBtn: 'Xem Chính sách quyền riêng tư', sections: [
      { h: '1. Giấy phép sử dụng ứng dụng', p: [
        'VocabLuxe cấp cho bạn quyền cá nhân, phi thương mại, không độc quyền và không thể chuyển nhượng để cài đặt và sử dụng ứng dụng nhằm mục đích học tập.',
        'Bạn không được bán lại, cho thuê, sao chép hàng loạt hoặc trích xuất dữ liệu từ vựng để phân phối lại.',
        'Ứng dụng được cung cấp “nguyên trạng”, không có bảo đảm nào. Nghĩa, phiên âm và câu ví dụ có thể do máy dịch nên có thể sai sót. Trong phạm vi pháp luật cho phép, nhà phát triển không chịu trách nhiệm cho thiệt hại phát sinh từ việc sử dụng ứng dụng.'] },
      { h: '2. Tiếng Anh — nguồn dữ liệu & giấy phép', li: [
        'Danh sách từ và cấp độ: The Oxford 3000™ / Oxford 5000™, © Oxford University Press. “Oxford 3000” và “Oxford 5000” là nhãn hiệu của Oxford University Press.',
        'Phiên âm và định nghĩa tiếng Anh: Free Dictionary API (dictionaryapi.dev), dữ liệu gốc từ Wiktionary, giấy phép CC BY-SA 3.0.',
        'Câu ví dụ: Tatoeba (tatoeba.org), giấy phép CC BY 2.0 FR, do các thành viên Tatoeba đóng góp.',
        'Dịch tự động: Google Dịch và MyMemory (Translated).'] },
      { h: '3. Tiếng Trung — nguồn dữ liệu & giấy phép', li: [
        'Danh sách từ theo cấp độ HSK 1–6. “HSK” là tên gọi và nhãn hiệu của Chinese Testing International (CTI).',
        'Pinyin, nghĩa và câu ví dụ được tích hợp sẵn; phần còn thiếu được bổ sung từ Tatoeba (CC BY 2.0 FR) và dịch tự động (Google Dịch / MyMemory).'] },
      { h: '4. Quảng cáo', p: [
        'Ứng dụng hiển thị quảng cáo do Google AdMob cung cấp. AdMob có thể dùng mã quảng cáo (Advertising ID), địa chỉ IP và thông tin thiết bị để hiển thị và đo lường quảng cáo.',
        'Ở nơi pháp luật yêu cầu (ví dụ EEA, Vương quốc Anh), bạn sẽ được hỏi đồng ý qua thông báo của Google và có thể đổi lựa chọn sau. Bạn có thể đặt lại mã quảng cáo hoặc tắt quảng cáo cá nhân hóa trong Cài đặt Android > Google > Quảng cáo. Chi tiết: policies.google.com/technologies/partner-sites'] },
      { h: '5. Phát âm', p: ['Phát âm dùng bộ chuyển văn bản thành giọng nói (Text-to-Speech) có sẵn trên thiết bị; ứng dụng không ghi âm hay lưu tệp âm thanh. Tùy cài đặt máy, nhà cung cấp bộ đọc giọng có thể xử lý văn bản được đọc theo chính sách của họ.'] },
      { h: '6. Thành phần mã nguồn mở', li: [
        'AndroidX Activity, Core, WebKit — Apache License 2.0 (apache.org/licenses/LICENSE-2.0).',
        'Kotlin Standard Library — Apache License 2.0.',
        'Thư viện Google Play In-App Update — do Google cung cấp theo điều khoản riêng của Google.'] },
      { h: '6b. Miễn trừ liên kết', p: ['VocabLuxe là ứng dụng độc lập, không liên kết với, không được bảo trợ hay xác nhận bởi Oxford University Press, Chinese Testing International, Google, Tatoeba hay Wiktionary. Mọi tên gọi và nhãn hiệu thuộc về chủ sở hữu tương ứng và chỉ được nhắc đến để nêu nguồn.'] },
      { h: '7. Quyền riêng tư', p: ['Không cần tài khoản. Tiến độ học và cài đặt chỉ lưu trên máy bạn. Từ bạn tra được gửi tới các dịch vụ ở mục 2 và 3; quảng cáo do Google AdMob cung cấp; việc kiểm tra cập nhật dùng Google Play. Xem đầy đủ trong Chính sách quyền riêng tư.'] },
    ] },
    en: { privacyBtn: 'View Privacy Policy', sections: [
      { h: '1. License to use the app', p: [
        'VocabLuxe grants you a personal, non-commercial, non-exclusive, non-transferable license to install and use the app for learning.',
        'You may not resell, rent, mass-copy or extract the vocabulary data in order to redistribute it.',
        'The app is provided “as is” without warranty of any kind. Meanings, phonetics and examples may be machine-translated and may contain errors. To the extent permitted by law, the developer is not liable for damages arising from use of the app.'] },
      { h: '2. English — data sources & licenses', li: [
        'Word list and levels: The Oxford 3000™ / Oxford 5000™, © Oxford University Press. “Oxford 3000” and “Oxford 5000” are trademarks of Oxford University Press.',
        'Phonetics and English definitions: Free Dictionary API (dictionaryapi.dev), data derived from Wiktionary, CC BY-SA 3.0.',
        'Example sentences: Tatoeba (tatoeba.org), CC BY 2.0 FR, contributed by Tatoeba members.',
        'Machine translation: Google Translate and MyMemory (Translated).'] },
      { h: '3. Chinese — data sources & licenses', li: [
        'Word list by HSK levels 1–6. “HSK” is a name and trademark of Chinese Testing International (CTI).',
        'Pinyin, meanings and example sentences are built into the app; missing items are added from Tatoeba (CC BY 2.0 FR) and machine translation (Google Translate / MyMemory).'] },
      { h: '4. Advertising', p: [
        'The app shows ads provided by Google AdMob. AdMob may use your device’s advertising ID, IP address and device information to show and measure ads.',
        'Where required (for example in the EEA and the UK), you are asked for consent through Google’s consent message and can change your choice later. You can reset your advertising ID or opt out of personalized ads in Android Settings > Google > Ads. Learn more: policies.google.com/technologies/partner-sites'] },
      { h: '5. Pronunciation', p: ['Pronunciation uses the text-to-speech engine installed on your device; the app does not record audio or store audio files. Depending on your device settings, the engine provider may process the spoken text under its own policy.'] },
      { h: '6. Open-source components', li: [
        'AndroidX Activity, Core, WebKit — Apache License 2.0 (apache.org/licenses/LICENSE-2.0).',
        'Kotlin Standard Library — Apache License 2.0.',
        'Google Play In-App Update library — provided by Google under Google’s own terms.'] },
      { h: '6b. No affiliation', p: ['VocabLuxe is an independent app and is not affiliated with, sponsored or endorsed by Oxford University Press, Chinese Testing International, Google, Tatoeba or Wiktionary. All names and trademarks belong to their respective owners and are mentioned only to credit sources.'] },
      { h: '7. Privacy', p: ['No account is required. Your study progress and settings are stored only on your device. The words you look up are sent to the services in sections 2 and 3; ads are provided by Google AdMob; update checks use Google Play. See the full Privacy Policy.'] },
    ] },
    zh: { privacyBtn: '查看隐私政策', sections: [
      { h: '1. 应用使用许可', p: [
        'VocabLuxe 授予您个人、非商业、非独占、不可转让的许可，用于安装并使用本应用进行学习。',
        '未经许可，您不得转售、出租、批量复制或提取词汇数据用于再分发。',
        '本应用按“现状”提供，不作任何保证。释义、音标和例句可能由机器翻译生成，可能存在错误。在法律允许的范围内，开发者不对使用本应用造成的损失承担责任。'] },
      { h: '2. 英语——数据来源与许可', li: [
        '词表与级别：The Oxford 3000™ / Oxford 5000™，© Oxford University Press。“Oxford 3000”和“Oxford 5000”是牛津大学出版社的商标。',
        '音标与英文释义：Free Dictionary API（dictionaryapi.dev），数据源自 Wiktionary，许可 CC BY-SA 3.0。',
        '例句：Tatoeba（tatoeba.org），许可 CC BY 2.0 FR，由 Tatoeba 成员贡献。',
        '机器翻译：Google 翻译与 MyMemory（Translated）。'] },
      { h: '3. 汉语——数据来源与许可', li: [
        '词表按 HSK 1–6 级划分。“HSK”是 Chinese Testing International（CTI）的名称和商标。',
        '拼音、释义和例句已内置于应用；缺失部分来自 Tatoeba（CC BY 2.0 FR）和机器翻译（Google 翻译 / MyMemory）。'] },
      { h: '4. 广告', p: [
        '本应用展示由 Google AdMob 提供的广告。AdMob 可能使用您设备的广告 ID、IP 地址和设备信息来展示和衡量广告。',
        '在法律要求的地区（例如欧洲经济区和英国），您会通过 Google 的同意提示被询问，并可随时更改选择。您可以在 Android“设置 > Google > 广告”中重置广告 ID 或停用个性化广告。详情：policies.google.com/technologies/partner-sites'] },
      { h: '5. 发音', p: ['发音使用您设备上安装的文字转语音引擎；本应用不录音，也不保存音频文件。视设备设置而定，语音引擎提供商可能按其自身政策处理被朗读的文本。'] },
      { h: '6. 开源组件', li: [
        'AndroidX Activity、Core、WebKit——Apache License 2.0（apache.org/licenses/LICENSE-2.0）。',
        'Kotlin Standard Library——Apache License 2.0。',
        'Google Play 应用内更新库——由 Google 按其自身条款提供。'] },
      { h: '6b. 无关联声明', p: ['VocabLuxe 是独立应用，与牛津大学出版社、Chinese Testing International、Google、Tatoeba 或 Wiktionary 无关联，也未获其赞助或认可。所有名称和商标归各自所有者所有，仅用于注明来源。'] },
      { h: '7. 隐私', p: ['无需账号。学习进度和设置仅保存在您的设备上。您查询的单词会发送至第 2、3 节所列服务；广告由 Google AdMob 提供；更新检查使用 Google Play。完整内容请查看隐私政策。'] },
    ] },
    es: { privacyBtn: 'Ver la Política de privacidad', sections: [
      { h: '1. Licencia de uso de la aplicación', p: [
        'VocabLuxe te concede una licencia personal, no comercial, no exclusiva e intransferible para instalar y usar la aplicación con fines de aprendizaje.',
        'No puedes revender, alquilar, copiar en masa ni extraer los datos de vocabulario para redistribuirlos.',
        'La aplicación se ofrece «tal cual», sin garantías de ningún tipo. Los significados, la fonética y los ejemplos pueden ser traducciones automáticas y contener errores. En la medida permitida por la ley, el desarrollador no se responsabiliza de los daños derivados del uso de la aplicación.'] },
      { h: '2. Inglés: fuentes de datos y licencias', li: [
        'Lista de palabras y niveles: The Oxford 3000™ / Oxford 5000™, © Oxford University Press. «Oxford 3000» y «Oxford 5000» son marcas de Oxford University Press.',
        'Fonética y definiciones en inglés: Free Dictionary API (dictionaryapi.dev), datos derivados de Wiktionary, CC BY-SA 3.0.',
        'Frases de ejemplo: Tatoeba (tatoeba.org), CC BY 2.0 FR, aportadas por miembros de Tatoeba.',
        'Traducción automática: Google Translate y MyMemory (Translated).'] },
      { h: '3. Chino: fuentes de datos y licencias', li: [
        'Lista de palabras por niveles HSK 1–6. «HSK» es un nombre y una marca de Chinese Testing International (CTI).',
        'El pinyin, los significados y los ejemplos vienen incluidos en la aplicación; lo que falta se completa con Tatoeba (CC BY 2.0 FR) y traducción automática (Google Translate / MyMemory).'] },
      { h: '4. Publicidad', p: [
        'La aplicación muestra anuncios proporcionados por Google AdMob. AdMob puede usar el ID de publicidad, la dirección IP y la información del dispositivo para mostrar y medir anuncios.',
        'Donde la ley lo exige (por ejemplo, en el EEE y el Reino Unido), se te pide consentimiento mediante el mensaje de Google y puedes cambiar tu elección más tarde. Puedes restablecer el ID de publicidad o desactivar los anuncios personalizados en Ajustes de Android > Google > Anuncios. Más información: policies.google.com/technologies/partner-sites'] },
      { h: '5. Pronunciación', p: ['La pronunciación usa el motor de texto a voz instalado en tu dispositivo; la aplicación no graba audio ni guarda archivos de audio. Según los ajustes del dispositivo, el proveedor del motor puede procesar el texto leído según su propia política.'] },
      { h: '6. Componentes de código abierto', li: [
        'AndroidX Activity, Core, WebKit — Apache License 2.0 (apache.org/licenses/LICENSE-2.0).',
        'Kotlin Standard Library — Apache License 2.0.',
        'Biblioteca Google Play In-App Update — proporcionada por Google bajo sus propios términos.'] },
      { h: '6b. Sin afiliación', p: ['VocabLuxe es una aplicación independiente y no está afiliada, patrocinada ni respaldada por Oxford University Press, Chinese Testing International, Google, Tatoeba ni Wiktionary. Todos los nombres y marcas pertenecen a sus respectivos propietarios y se mencionan solo para citar las fuentes.'] },
      { h: '7. Privacidad', p: ['No se necesita cuenta. Tu progreso y ajustes se guardan solo en tu dispositivo. Las palabras que consultas se envían a los servicios de las secciones 2 y 3; los anuncios los ofrece Google AdMob; la comprobación de actualizaciones usa Google Play. Consulta la Política de privacidad completa.'] },
    ] },
    pt: { privacyBtn: 'Ver a Política de privacidade', sections: [
      { h: '1. Licença de uso do aplicativo', p: [
        'O VocabLuxe concede a você uma licença pessoal, não comercial, não exclusiva e intransferível para instalar e usar o aplicativo para fins de aprendizado.',
        'Você não pode revender, alugar, copiar em massa nem extrair os dados de vocabulário para redistribuí-los.',
        'O aplicativo é fornecido “como está”, sem garantias de qualquer tipo. Significados, fonética e exemplos podem ser traduzidos automaticamente e conter erros. Na medida permitida por lei, o desenvolvedor não se responsabiliza por danos decorrentes do uso do aplicativo.'] },
      { h: '2. Inglês: fontes de dados e licenças', li: [
        'Lista de palavras e níveis: The Oxford 3000™ / Oxford 5000™, © Oxford University Press. “Oxford 3000” e “Oxford 5000” são marcas da Oxford University Press.',
        'Fonética e definições em inglês: Free Dictionary API (dictionaryapi.dev), dados derivados do Wiktionary, CC BY-SA 3.0.',
        'Frases de exemplo: Tatoeba (tatoeba.org), CC BY 2.0 FR, contribuídas por membros do Tatoeba.',
        'Tradução automática: Google Tradutor e MyMemory (Translated).'] },
      { h: '3. Chinês: fontes de dados e licenças', li: [
        'Lista de palavras por níveis HSK 1–6. “HSK” é um nome e uma marca da Chinese Testing International (CTI).',
        'Pinyin, significados e exemplos já vêm no aplicativo; o que falta é complementado com Tatoeba (CC BY 2.0 FR) e tradução automática (Google Tradutor / MyMemory).'] },
      { h: '4. Publicidade', p: [
        'O aplicativo exibe anúncios fornecidos pelo Google AdMob. O AdMob pode usar o ID de publicidade, o endereço IP e informações do dispositivo para exibir e medir anúncios.',
        'Onde a lei exigir (por exemplo, no EEE e no Reino Unido), você é solicitado a dar consentimento pela mensagem do Google e pode alterar a escolha depois. Você pode redefinir o ID de publicidade ou desativar anúncios personalizados em Configurações do Android > Google > Anúncios. Saiba mais: policies.google.com/technologies/partner-sites'] },
      { h: '5. Pronúncia', p: ['A pronúncia usa o mecanismo de conversão de texto em voz instalado no seu dispositivo; o aplicativo não grava áudio nem armazena arquivos de áudio. Dependendo das configurações do aparelho, o provedor do mecanismo pode processar o texto lido conforme a própria política.'] },
      { h: '6. Componentes de código aberto', li: [
        'AndroidX Activity, Core, WebKit — Apache License 2.0 (apache.org/licenses/LICENSE-2.0).',
        'Kotlin Standard Library — Apache License 2.0.',
        'Biblioteca Google Play In-App Update — fornecida pelo Google sob termos próprios do Google.'] },
      { h: '6b. Sem afiliação', p: ['O VocabLuxe é um aplicativo independente e não é afiliado, patrocinado nem endossado pela Oxford University Press, Chinese Testing International, Google, Tatoeba ou Wiktionary. Todos os nomes e marcas pertencem aos respectivos proprietários e são citados apenas para creditar as fontes.'] },
      { h: '7. Privacidade', p: ['Não é necessário criar conta. Seu progresso e configurações ficam apenas no seu dispositivo. As palavras consultadas são enviadas aos serviços das seções 2 e 3; os anúncios são fornecidos pelo Google AdMob; a verificação de atualizações usa o Google Play. Veja a Política de privacidade completa.'] },
    ] },
    ru: { privacyBtn: 'Открыть Политику конфиденциальности', sections: [
      { h: '1. Лицензия на использование приложения', p: [
        'VocabLuxe предоставляет вам личную, некоммерческую, неисключительную и непередаваемую лицензию на установку и использование приложения в учебных целях.',
        'Запрещается перепродавать, сдавать в аренду, массово копировать или извлекать словарные данные для дальнейшего распространения.',
        'Приложение предоставляется «как есть», без каких-либо гарантий. Значения, транскрипция и примеры могут быть получены машинным переводом и содержать ошибки. В пределах, допускаемых законом, разработчик не несёт ответственности за ущерб, возникший при использовании приложения.'] },
      { h: '2. Английский — источники данных и лицензии', li: [
        'Список слов и уровни: The Oxford 3000™ / Oxford 5000™, © Oxford University Press. «Oxford 3000» и «Oxford 5000» — товарные знаки Oxford University Press.',
        'Транскрипция и английские определения: Free Dictionary API (dictionaryapi.dev), данные на основе Wiktionary, лицензия CC BY-SA 3.0.',
        'Примеры предложений: Tatoeba (tatoeba.org), лицензия CC BY 2.0 FR, вклад участников Tatoeba.',
        'Машинный перевод: Google Translate и MyMemory (Translated).'] },
      { h: '3. Китайский — источники данных и лицензии', li: [
        'Список слов по уровням HSK 1–6. «HSK» — название и товарный знак Chinese Testing International (CTI).',
        'Пиньинь, значения и примеры встроены в приложение; недостающее дополняется из Tatoeba (CC BY 2.0 FR) и машинного перевода (Google Translate / MyMemory).'] },
      { h: '4. Реклама', p: [
        'Приложение показывает рекламу Google AdMob. AdMob может использовать рекламный идентификатор, IP-адрес и данные об устройстве для показа и измерения рекламы.',
        'Там, где этого требует закон (например, в ЕЭЗ и Великобритании), вас просят дать согласие в окне Google, и позже вы можете изменить выбор. Сбросить рекламный идентификатор или отключить персонализированную рекламу можно в Настройках Android > Google > Реклама. Подробнее: policies.google.com/technologies/partner-sites'] },
      { h: '5. Произношение', p: ['Для произношения используется синтезатор речи, установленный на вашем устройстве; приложение не записывает звук и не сохраняет аудиофайлы. В зависимости от настроек устройства поставщик синтезатора может обрабатывать озвучиваемый текст по собственной политике.'] },
      { h: '6. Компоненты с открытым исходным кодом', li: [
        'AndroidX Activity, Core, WebKit — Apache License 2.0 (apache.org/licenses/LICENSE-2.0).',
        'Kotlin Standard Library — Apache License 2.0.',
        'Библиотека Google Play In-App Update — предоставляется Google на собственных условиях Google.'] },
      { h: '6b. Отсутствие связи', p: ['VocabLuxe — независимое приложение; оно не связано с Oxford University Press, Chinese Testing International, Google, Tatoeba и Wiktionary и не спонсируется и не одобряется ими. Все названия и товарные знаки принадлежат их владельцам и упоминаются только для указания источников.'] },
      { h: '7. Конфиденциальность', p: ['Учётная запись не нужна. Прогресс и настройки хранятся только на вашем устройстве. Искомые слова отправляются службам из разделов 2 и 3; рекламу показывает Google AdMob; проверка обновлений использует Google Play. Полный текст — в Политике конфиденциальности.'] },
    ] },
    ja: { privacyBtn: 'プライバシーポリシーを見る', sections: [
      { h: '1. アプリの使用許諾', p: [
        'VocabLuxe は、学習目的でアプリをインストールして使用するための、個人的・非商業的・非独占的・譲渡不可の使用許諾をお客様に付与します。',
        '語彙データを再配布する目的で、転売・貸与・大量複製・抽出することはできません。',
        '本アプリは現状有姿で提供され、いかなる保証もありません。意味・発音表記・例文は機械翻訳による場合があり、誤りを含むことがあります。法令で認められる範囲で、開発者は本アプリの利用により生じた損害について責任を負いません。'] },
      { h: '2. 英語 — データの出典とライセンス', li: [
        '単語リストとレベル：The Oxford 3000™ / Oxford 5000™、© Oxford University Press。「Oxford 3000」「Oxford 5000」は Oxford University Press の商標です。',
        '発音表記と英語の定義：Free Dictionary API（dictionaryapi.dev）。データは Wiktionary 由来、CC BY-SA 3.0。',
        '例文：Tatoeba（tatoeba.org）、CC BY 2.0 FR。Tatoeba の投稿者による提供。',
        '機械翻訳：Google 翻訳および MyMemory（Translated）。'] },
      { h: '3. 中国語 — データの出典とライセンス', li: [
        'HSK 1〜6級に基づく単語リスト。「HSK」は Chinese Testing International（CTI）の名称および商標です。',
        'ピンイン・意味・例文はアプリに内蔵しており、不足分は Tatoeba（CC BY 2.0 FR）と機械翻訳（Google 翻訳 / MyMemory）で補います。'] },
      { h: '4. 広告', p: [
        '本アプリは Google AdMob が提供する広告を表示します。AdMob は、広告の表示と効果測定のために、広告 ID、IP アドレス、端末情報を使用することがあります。',
        '法令で必要な地域（EEA や英国など）では、Google の同意メッセージで同意をお尋ねし、後から変更できます。広告 ID のリセットやパーソナライズ広告の無効化は、Android の「設定 > Google > 広告」で行えます。詳細：policies.google.com/technologies/partner-sites'] },
      { h: '5. 発音', p: ['発音には端末にインストールされた音声合成エンジンを使用します。アプリは録音せず、音声ファイルも保存しません。端末の設定によっては、エンジン提供元が読み上げるテキストを独自のポリシーで処理する場合があります。'] },
      { h: '6. オープンソースコンポーネント', li: [
        'AndroidX Activity、Core、WebKit — Apache License 2.0（apache.org/licenses/LICENSE-2.0）。',
        'Kotlin Standard Library — Apache License 2.0。',
        'Google Play アプリ内アップデートライブラリ — Google が独自の条件で提供。'] },
      { h: '6b. 提携関係について', p: ['VocabLuxe は独立したアプリであり、Oxford University Press、Chinese Testing International、Google、Tatoeba、Wiktionary との提携・後援・承認関係はありません。名称および商標は各所有者に帰属し、出典の明示のためにのみ記載しています。'] },
      { h: '7. プライバシー', p: ['アカウントは不要です。学習の進捗と設定は端末内にのみ保存されます。検索した単語は第2・3項のサービスに送信され、広告は Google AdMob が提供し、アップデート確認には Google Play を使用します。詳細はプライバシーポリシーをご覧ください。'] },
    ] },
    ko: { privacyBtn: '개인정보 처리방침 보기', sections: [
      { h: '1. 앱 사용 라이선스', p: [
        'VocabLuxe는 학습 목적으로 앱을 설치하고 사용할 수 있는 개인적, 비상업적, 비독점적, 양도 불가능한 라이선스를 귀하에게 부여합니다.',
        '어휘 데이터를 재배포하기 위해 재판매, 대여, 대량 복사 또는 추출할 수 없습니다.',
        '앱은 어떠한 보증 없이 "있는 그대로" 제공됩니다. 뜻, 발음 표기, 예문은 기계 번역일 수 있으며 오류가 있을 수 있습니다. 법이 허용하는 범위에서 개발자는 앱 사용으로 발생한 손해에 책임지지 않습니다.'] },
      { h: '2. 영어 — 데이터 출처 및 라이선스', li: [
        '단어 목록 및 레벨: The Oxford 3000™ / Oxford 5000™, © Oxford University Press. "Oxford 3000"과 "Oxford 5000"은 Oxford University Press의 상표입니다.',
        '발음 표기 및 영어 정의: Free Dictionary API(dictionaryapi.dev), 데이터는 Wiktionary 기반, CC BY-SA 3.0.',
        '예문: Tatoeba(tatoeba.org), CC BY 2.0 FR, Tatoeba 회원이 기여.',
        '기계 번역: Google 번역 및 MyMemory(Translated).'] },
      { h: '3. 중국어 — 데이터 출처 및 라이선스', li: [
        'HSK 1–6급 기준 단어 목록. "HSK"는 Chinese Testing International(CTI)의 명칭이자 상표입니다.',
        '병음, 뜻, 예문은 앱에 내장되어 있으며 부족한 부분은 Tatoeba(CC BY 2.0 FR)와 기계 번역(Google 번역 / MyMemory)으로 보충합니다.'] },
      { h: '4. 광고', p: [
        '앱은 Google AdMob이 제공하는 광고를 표시합니다. AdMob은 광고 표시와 측정을 위해 기기의 광고 ID, IP 주소, 기기 정보를 사용할 수 있습니다.',
        '법률상 필요한 지역(예: EEA, 영국)에서는 Google의 동의 안내로 동의를 요청하며, 나중에 선택을 변경할 수 있습니다. Android 설정 > Google > 광고에서 광고 ID를 재설정하거나 맞춤 광고를 끌 수 있습니다. 자세히: policies.google.com/technologies/partner-sites'] },
      { h: '5. 발음', p: ['발음은 기기에 설치된 음성 합성(TTS) 엔진을 사용합니다. 앱은 녹음하지 않으며 오디오 파일을 저장하지 않습니다. 기기 설정에 따라 엔진 제공업체가 읽는 텍스트를 자체 정책에 따라 처리할 수 있습니다.'] },
      { h: '6. 오픈소스 구성 요소', li: [
        'AndroidX Activity, Core, WebKit — Apache License 2.0(apache.org/licenses/LICENSE-2.0).',
        'Kotlin Standard Library — Apache License 2.0.',
        'Google Play 인앱 업데이트 라이브러리 — Google이 자체 약관에 따라 제공.'] },
      { h: '6b. 제휴 관계 없음', p: ['VocabLuxe는 독립 앱이며 Oxford University Press, Chinese Testing International, Google, Tatoeba, Wiktionary와 제휴, 후원 또는 승인 관계가 없습니다. 모든 명칭과 상표는 각 소유자에게 귀속되며 출처 표기를 위해서만 언급됩니다.'] },
      { h: '7. 개인정보', p: ['계정이 필요 없습니다. 학습 진행 상황과 설정은 기기에만 저장됩니다. 조회한 단어는 2·3항의 서비스로 전송되고, 광고는 Google AdMob이 제공하며, 업데이트 확인에는 Google Play를 사용합니다. 전체 내용은 개인정보 처리방침을 확인하세요.'] },
    ] },
  };

  return { codes, FLAG, NATIVE, ORDER, LOC, NAMES, T, POS, TOPIC, LEGAL };
})();
