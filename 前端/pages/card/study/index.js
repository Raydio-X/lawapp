Page({
  data: {
    // 知识库ID
    libraryId: 1,
    // 当前卡片索引
    currentIndex: 0,
    // 总卡片数
    totalCards: 10,
    // 当前卡片数据
    currentCard: {
      id: 1,
      question: '刑法的概念与特征是什么？',
      answer: '刑法是规定犯罪、刑事责任和刑罚的法律规范的总和。其特征包括：\n1. 特定性：只规定犯罪与刑罚\n2. 严厉性：涉及生命、自由、财产等最重要的法益\n3. 补充性：只有在其他法律手段不足以保护法益时才适用\n4. 保障性：保障其他法律的实施',
      tags: ['基础', '概念', '必考'],
      learned: false
    },
    // 答案是否已展开
    answerRevealed: false,
    // 学习反馈（difficult/normal/easy）
    feedback: '',
    // 评论列表
    comments: [
      {
        id: 1,
        username: '法硕小王',
        avatar: '王',
        content: '刑法的补充性特征很重要，要记住是最后手段！',
        time: '2小时前'
      },
      {
        id: 2,
        username: '考研党',
        avatar: '考',
        content: '四个特征可以用"特严补保"来记忆',
        time: '5小时前'
      }
    ],
    // 评论输入文本
    commentText: '',
    // 当前知识库的所有卡片（用于切换）
    cardList: []
  },

  onLoad(options) {
    // 接收传入的参数
    const { cardId, libraryId, index, mode } = options;
    
    if (libraryId) {
      this.setData({ libraryId: parseInt(libraryId) });
    }
    
    // 加载卡片数据
    this.loadCardData(cardId, parseInt(index) || 0);
    
    // 加载评论数据
    this.loadComments(cardId);
  },

  onUnload() {
    // 页面卸载时保存学习进度
    this.saveStudyProgress();
  },

  // 加载卡片数据
  loadCardData(cardId, index) {
    // 模拟加载当前知识库的所有卡片
    const mockCards = [
      {
        id: 1,
        question: '刑法的概念与特征是什么？',
        answer: '刑法是规定犯罪、刑事责任和刑罚的法律规范的总和。其特征包括：\n1. 特定性：只规定犯罪与刑罚\n2. 严厉性：涉及生命、自由、财产等最重要的法益\n3. 补充性：只有在其他法律手段不足以保护法益时才适用\n4. 保障性：保障其他法律的实施',
        tags: ['基础', '概念', '必考'],
        learned: false
      },
      {
        id: 2,
        question: '罪刑法定原则的基本内容是什么？',
        answer: '罪刑法定原则是指"法无明文规定不为罪，法无明文规定不处罚"。其基本内容包括：\n1. 成文法主义：禁止习惯法\n2. 禁止事后法：禁止溯及既往\n3. 禁止类推：禁止不利于被告人的类推解释\n4. 明确性原则：罪刑规范必须明确\n5. 禁止绝对不定期刑',
        tags: ['原则', '必考', '重点'],
        learned: true
      },
      {
        id: 3,
        question: '刑法解释的种类有哪些？',
        answer: '刑法解释按效力分为：\n1. 立法解释：全国人大常委会的解释\n2. 司法解释：最高法、最高检的解释\n3. 学理解释：学者、机构的解释（无法律效力）\n\n按方法分为：\n1. 文理解释：按文字含义解释\n2. 论理解释：按立法精神解释（扩张、限制、当然、历史、比较、目的解释等）',
        tags: ['基础', '理解'],
        learned: false
      },
      {
        id: 4,
        question: '什么是犯罪构成？',
        answer: '犯罪构成是刑法规定的，决定某一行为的社会危害性及其程度，而为该行为成立犯罪所必须具备的一切客观要件与主观要件的有机整体。\n\n犯罪构成四要件：\n1. 犯罪客体\n2. 犯罪客观方面\n3. 犯罪主体\n4. 犯罪主观方面',
        tags: ['基础', '重点'],
        learned: false
      },
      {
        id: 5,
        question: '正当防卫的成立条件有哪些？',
        answer: '正当防卫的成立条件：\n1. 起因条件：存在不法侵害\n2. 时间条件：不法侵害正在进行\n3. 主观条件：具有防卫意图\n4. 对象条件：针对不法侵害人本人\n5. 限度条件：没有明显超过必要限度造成重大损害\n\n特殊防卫：对正在进行行凶、杀人、抢劫、强奸、绑架以及其他严重危及人身安全的暴力犯罪，采取防卫行为，造成不法侵害人伤亡的，不属于防卫过当。',
        tags: ['重点', '必考', '难点'],
        learned: true
      }
    ];

    const currentIndex = index || 0;
    const currentCard = mockCards[currentIndex] || mockCards[0];

    this.setData({
      cardList: mockCards,
      totalCards: mockCards.length,
      currentIndex: currentIndex,
      currentCard: currentCard,
      answerRevealed: false,
      feedback: '',
      commentText: ''
    });

    // 更新页面标题
    wx.setNavigationBarTitle({
      title: `卡片 ${currentIndex + 1}/${mockCards.length}`
    });
  },

  // 加载评论数据
  loadComments(cardId) {
    // 模拟从服务器加载评论
    // 实际项目中这里应该调用 API
    console.log('加载卡片评论:', cardId);
  },

  // 查看答案
  onRevealAnswer() {
    this.setData({
      answerRevealed: true
    });
  },

  // 学习反馈
  onFeedback(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      feedback: type
    });
    
    // 保存反馈到本地或服务器
    console.log('学习反馈:', type);
  },

  // 评论输入
  onCommentInput(e) {
    this.setData({
      commentText: e.detail.value
    });
  },

  // 提交评论
  onSubmitComment() {
    const { commentText, comments, currentCard } = this.data;
    
    if (!commentText.trim()) {
      return;
    }

    const newComment = {
      id: Date.now(),
      username: '我',
      avatar: '我',
      content: commentText.trim(),
      time: '刚刚'
    };

    this.setData({
      comments: [newComment, ...comments],
      commentText: ''
    });

    // 保存评论到服务器
    console.log('提交评论:', newComment);
  },

  // 上一张卡片
  onPrevCard() {
    const { currentIndex, cardList } = this.data;
    
    if (currentIndex <= 0) {
      wx.showToast({
        title: '已经是第一张了',
        icon: 'none'
      });
      return;
    }

    const newIndex = currentIndex - 1;
    this.switchCard(newIndex);
  },

  // 下一张卡片
  onNextCard() {
    const { currentIndex, totalCards, cardList } = this.data;
    
    if (currentIndex >= totalCards - 1) {
      wx.showToast({
        title: '已经是最后一张了',
        icon: 'none'
      });
      return;
    }

    const newIndex = currentIndex + 1;
    this.switchCard(newIndex);
  },

  // 切换卡片
  switchCard(index) {
    const { cardList } = this.data;
    const newCard = cardList[index];

    // 重置状态
    this.setData({
      currentIndex: index,
      currentCard: newCard,
      answerRevealed: false,
      feedback: '',
      commentText: ''
    });

    // 更新页面标题
    wx.setNavigationBarTitle({
      title: `卡片 ${index + 1}/${cardList.length}`
    });

    // 加载新卡片的评论
    this.loadComments(newCard.id);

    this.saveStudyProgress();
  },

  saveStudyProgress() {
    const { libraryId, currentIndex, currentCard } = this.data;
    
    // 保存到本地存储
    const progress = {
      libraryId,
      cardId: currentCard.id,
      index: currentIndex,
      learned: currentCard.learned,
      timestamp: Date.now()
    };

    wx.setStorageSync(`study_progress_${libraryId}`, progress);
    console.log('保存学习进度:', progress);
  }
});
