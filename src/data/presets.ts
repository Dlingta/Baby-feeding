import type { DiaryMood, DiaryWeather, EarlyLearningStage, VaccinePreset } from '../types/baby';

export const DIARY_MOODS: Array<{ value: DiaryMood; label: string; tone: string }> = [
  { value: '开心', label: '开心', tone: '#D9A44E' },
  { value: '安静', label: '安静', tone: '#7DA88A' },
  { value: '熟睡', label: '熟睡', tone: '#6E95B0' },
  { value: '闹腾', label: '闹腾', tone: '#D47B5B' },
  { value: '哭闹', label: '哭闹', tone: '#D45D48' },
  { value: '其他', label: '其他', tone: '#8E998E' },
];

export const DIARY_WEATHERS: DiaryWeather[] = ['晴天', '多云', '阴天', '小雨', '大风', '雪天'];

export const ILLNESS_SYMPTOMS: string[] = [
  '发热',
  '咳嗽',
  '流涕',
  '鼻塞',
  '腹泻',
  '呕吐',
  '皮疹',
  '食欲减退',
  '精神倦怠',
];

export const EARLY_LEARNING_STAGES: EarlyLearningStage[] = [
  {
    id: 'stage-0-1',
    minMonths: 0,
    maxMonths: 1,
    stageLabel: '0–1 月龄',
    focusTitle: '温和感知与安全感建立',
    tips: [
      {
        id: 'el-0-1-1',
        title: '黑白视觉追踪',
        detail: '在距宝宝眼睛 20–30 厘米处缓慢移动黑白大图案卡，每天 2 次，每次 1–2 分钟。',
      },
      {
        id: 'el-0-1-2',
        title: '清醒时短时趴卧（Tummy Time）',
        detail: '吃奶后半小时尝试在父母胸口或硬质垫上趴卧 1–2 分钟，温和锻炼颈背力量。',
      },
      {
        id: 'el-0-1-3',
        title: '轻柔抚触与眼神回应',
        detail: '换尿布或洗澡后轻抚手脚与背部，用温和语调回应宝宝的每一次注视与咕哝。',
      },
      {
        id: 'el-0-1-4',
        title: '听觉安抚与轻音乐',
        detail: '播放舒缓柔和的摇篮曲或轻声哼唱，帮助宝宝熟悉家庭成员的声音节奏。',
      },
    ],
  },
  {
    id: 'stage-2-3',
    minMonths: 2,
    maxMonths: 3,
    stageLabel: '2–3 月龄',
    focusTitle: '追视微笑与咿呀交流',
    tips: [
      {
        id: 'el-2-3-1',
        title: '彩色摇铃追视练习',
        detail: '用红色或粉蓝色小摇铃在宝宝眼前左右 180 度缓缓移动，吸引转头追看。',
      },
      {
        id: 'el-2-3-2',
        title: '模仿“咿呀”对话轮替',
        detail: '当宝宝发出“啊、哦”声时微笑回应并停顿等待，培养最早的语言轮替感。',
      },
      {
        id: 'el-2-3-3',
        title: '俯卧抬头看玩具',
        detail: '在宝宝前方摆放鲜明色块卡片或镜子，累计每天 15 分钟左右分段趴卧抬头。',
      },
      {
        id: 'el-2-3-4',
        title: '轻质抓握感知',
        detail: '将细柄布摇铃轻触宝宝掌心，鼓励五指主动张开抓握。',
      },
    ],
  },
  {
    id: 'stage-4-6',
    minMonths: 4,
    maxMonths: 6,
    stageLabel: '4–6 月龄',
    focusTitle: '翻身探索与双手协调',
    tips: [
      {
        id: 'el-4-6-1',
        title: '玩具引导左右翻身',
        detail: '将宝宝喜欢的沙锤放在身体斜上方，轻扶髋部协助感知翻身重心转移。',
      },
      {
        id: 'el-4-6-2',
        title: '不同材质触觉书探索',
        detail: '让宝宝触摸棉布、响纸、绒毛等不同触感布书页面，边摸边用短词描述。',
      },
      {
        id: 'el-4-6-3',
        title: '照镜子认识自己',
        detail: '抱着宝宝照安全防碎镜，指认眼睛、鼻子和小手，观察宝宝对镜中影像的微笑。',
      },
      {
        id: 'el-4-6-4',
        title: '双手传递积木块',
        detail: '提供大小合适、无锐角的木块或硅胶球，练习两手互递与放入口前探索。',
      },
    ],
  },
  {
    id: 'stage-7-9',
    minMonths: 7,
    maxMonths: 9,
    stageLabel: '7–9 月龄',
    focusTitle: '独坐爬行与精细捏取',
    tips: [
      {
        id: 'el-7-9-1',
        title: '爬行垫追球探险',
        detail: '在前方滚出一个慢速软球或布偶，鼓励宝宝腹爬或四肢协调向前爬行去够取。',
      },
      {
        id: 'el-7-9-2',
        title: '躲猫猫（客体永久性）',
        detail: '用小手帕遮住玩具或自己的脸再掀开，帮助理解“看不见但依然存在”。',
      },
      {
        id: 'el-7-9-3',
        title: '拇指食指捏取练习',
        detail: '在干净餐盘放软糯小块辅食（如熟南瓜丁）或大颗粒泡芙，锻炼精细动作。',
      },
      {
        id: 'el-7-9-4',
        title: '日常物品命名指认',
        detail: '重复指着“杯子、小狗、树叶”并说出清晰名称，积累听觉词汇库。',
      },
    ],
  },
  {
    id: 'stage-10-12',
    minMonths: 10,
    maxMonths: 12,
    stageLabel: '10–12 月龄',
    focusTitle: '扶站过渡与社交手势',
    tips: [
      {
        id: 'el-10-12-1',
        title: '扶站与蹲起游戏',
        detail: '扶着稳固矮沙发站立，将玩具放在脚边吸引宝宝缓慢下蹲拾取再站起。',
      },
      {
        id: 'el-10-12-2',
        title: '敲击与放入容器',
        detail: '给一个小篮子和几块积木，练习“放进去、倒出来”和两手拿积木对敲节奏。',
      },
      {
        id: 'el-10-12-3',
        title: '挥手再见与指物表达',
        detail: '出门或睡前示范挥手“拜拜”、拍手鼓掌，鼓励用食指指出想要的物品。',
      },
      {
        id: 'el-10-12-4',
        title: '共读硬纸板绘本',
        detail: '每天睡前共读 1 本简短图画书，让宝宝自己尝试翻动厚纸页。',
      },
    ],
  },
  {
    id: 'stage-13-18',
    minMonths: 13,
    maxMonths: 18,
    stageLabel: '13–18 月龄',
    focusTitle: '独立学步与简单指令',
    tips: [
      {
        id: 'el-13-18-1',
        title: '不同地面平衡行走',
        detail: '在室内垫子、公园平缓草地或塑胶步道赤足/穿防滑鞋练习走动与转身。',
      },
      {
        id: 'el-13-18-2',
        title: '大积木叠高 2–4 块',
        detail: '和宝宝轮流搭高积木塔再一起推倒，锻炼手眼协调与因果认知。',
      },
      {
        id: 'el-13-18-3',
        title: '单步生活指令游戏',
        detail: '用温和口吻说“把球给妈妈”或“把勺子放盘子里”，完成后给予具体肯定。',
      },
      {
        id: 'el-13-18-4',
        title: '户外植物与声音观察',
        detail: '散步时一起看飘落的树叶、听鸟叫声，引导模仿动物叫声。',
      },
    ],
  },
  {
    id: 'stage-19-24',
    minMonths: 19,
    maxMonths: 24,
    stageLabel: '19–24 月龄',
    focusTitle: '双词表达与生活自理',
    tips: [
      {
        id: 'el-19-24-1',
        title: '大蜡笔涂鸦线条',
        detail: '准备粗短可水洗蜡笔和大白纸，让宝宝自由画圆圈与斜线，感受色彩与轨迹。',
      },
      {
        id: 'el-19-24-2',
        title: '双词短句自然扩写',
        detail: '宝宝说“狗狗”时，温柔回应“对，白色的小狗狗在跑”，丰富词组表达。',
      },
      {
        id: 'el-19-24-3',
        title: '按形状或颜色配对',
        detail: '用 2–3 种颜色的积木或水果模型，玩“找相同颜色放在一起”的分类游戏。',
      },
      {
        id: 'el-19-24-4',
        title: '用勺进食与收玩具',
        detail: '鼓励宝宝自己拿圆头小勺舀米饭，睡前一起哼歌把绘本放回书篮。',
      },
    ],
  },
  {
    id: 'stage-25-36',
    minMonths: 25,
    maxMonths: 120,
    stageLabel: '25–36 月龄+',
    focusTitle: '想象扮演与自主秩序',
    tips: [
      {
        id: 'el-25-36-1',
        title: '过家家角色扮演',
        detail: '用玩偶模拟“看医生、做饭、哄睡觉”等日常情景，发展共情与完整句子表达。',
      },
      {
        id: 'el-25-36-2',
        title: '4–6 块大拼图与穿珠',
        detail: '从 4 块动物拼图开始，培养空间观察力与专注耐力。',
      },
      {
        id: 'el-25-36-3',
        title: '复述绘本小片段',
        detail: '读完熟悉故事后，问“小兔子接下来去哪啦”，鼓励宝宝用自己的话讲出来。',
      },
      {
        id: 'el-25-36-4',
        title: '大小长短比较探索',
        detail: '在散步或整理衣物时对比“大袜子和小袜子、长树枝和短树枝”。',
      },
    ],
  },
];

// 国家免疫规划（国内常规免费一类疫苗参考排期）
export const CHINA_VACCINE_SCHEDULE: VaccinePreset[] = [
  {
    id: 'vac-hepb-1',
    name: '乙肝疫苗',
    doseLabel: '第 1 剂',
    targetMonths: 0,
    ageLabel: '出生时',
    note: '通常在出生后 24 小时内由产科医院完成接种。',
  },
  {
    id: 'vac-bcg-1',
    name: '卡介苗',
    doseLabel: '第 1 剂',
    targetMonths: 0,
    ageLabel: '出生时',
    note: '预防结核病，一般出生时接种，接种部位可能出现小脓疱属常见反应。',
  },
  {
    id: 'vac-hepb-2',
    name: '乙肝疫苗',
    doseLabel: '第 2 剂',
    targetMonths: 1,
    ageLabel: '1 月龄',
    note: '与第 1 剂间隔不少于 28 天，建议满月体检时一并核对。',
  },
  {
    id: 'vac-ipv-1',
    name: '脊灰灭活疫苗（IPV）',
    doseLabel: '第 1 剂',
    targetMonths: 2,
    ageLabel: '2 月龄',
    note: '预防脊髓灰质炎，肌内注射。',
  },
  {
    id: 'vac-ipv-2',
    name: '脊灰灭活疫苗（IPV）',
    doseLabel: '第 2 剂',
    targetMonths: 3,
    ageLabel: '3 月龄',
    note: '与第 1 剂至少间隔 28 天。',
  },
  {
    id: 'vac-dtap-1',
    name: '百白破疫苗',
    doseLabel: '第 1 剂',
    targetMonths: 3,
    ageLabel: '3 月龄',
    note: '预防百日咳、白喉、破伤风；接种后留意局部红肿或低热。',
  },
  {
    id: 'vac-opv-3',
    name: '脊灰减毒活疫苗（bOPV）',
    doseLabel: '第 3 剂',
    targetMonths: 4,
    ageLabel: '4 月龄',
    note: '口服糖丸或滴剂，喂服前后半小时避免喂过热牛奶或温水。',
  },
  {
    id: 'vac-dtap-2',
    name: '百白破疫苗',
    doseLabel: '第 2 剂',
    targetMonths: 4,
    ageLabel: '4 月龄',
    note: '与第 1 剂间隔不少于 28 天。',
  },
  {
    id: 'vac-dtap-3',
    name: '百白破疫苗',
    doseLabel: '第 3 剂',
    targetMonths: 5,
    ageLabel: '5 月龄',
    note: '完成百白破基础免疫第 3 针。',
  },
  {
    id: 'vac-hepb-3',
    name: '乙肝疫苗',
    doseLabel: '第 3 剂',
    targetMonths: 6,
    ageLabel: '6 月龄',
    note: '与第 1 剂间隔至少 4 个月、与第 2 剂间隔至少 60 天。',
  },
  {
    id: 'vac-mena-1',
    name: 'A 群流脑多糖疫苗',
    doseLabel: '第 1 剂',
    targetMonths: 6,
    ageLabel: '6 月龄',
    note: '预防 A 群脑膜炎球菌引起的流脑。',
  },
  {
    id: 'vac-mmr-1',
    name: '麻腮风疫苗',
    doseLabel: '第 1 剂',
    targetMonths: 8,
    ageLabel: '8 月龄',
    note: '预防麻疹、流行性腮腺炎和风疹；部分宝宝接种后 5–12 天可能有一过性低热或皮疹。',
  },
  {
    id: 'vac-je-1',
    name: '乙脑减毒活疫苗',
    doseLabel: '第 1 剂',
    targetMonths: 8,
    ageLabel: '8 月龄',
    note: '预防流行性乙型脑炎。',
  },
  {
    id: 'vac-mena-2',
    name: 'A 群流脑多糖疫苗',
    doseLabel: '第 2 剂',
    targetMonths: 9,
    ageLabel: '9 月龄',
    note: '与第 1 剂间隔不少于 3 个月。',
  },
  {
    id: 'vac-hepa-1',
    name: '甲肝减毒活疫苗',
    doseLabel: '第 1 剂',
    targetMonths: 18,
    ageLabel: '18 月龄',
    note: '预防甲型病毒性肝炎（若选灭活甲肝则按 2 剂次方案）。',
  },
  {
    id: 'vac-dtap-4',
    name: '百白破疫苗',
    doseLabel: '第 4 剂',
    targetMonths: 18,
    ageLabel: '18 月龄',
    note: '基础免疫完成后的加强针。',
  },
  {
    id: 'vac-mmr-2',
    name: '麻腮风疫苗',
    doseLabel: '第 2 剂',
    targetMonths: 18,
    ageLabel: '18 月龄',
    note: '18 月龄加强剂次。',
  },
  {
    id: 'vac-je-2',
    name: '乙脑减毒活疫苗',
    doseLabel: '第 2 剂',
    targetMonths: 24,
    ageLabel: '24 月龄',
    note: '2 周岁加强免疫。',
  },
  {
    id: 'vac-menac-1',
    name: 'A+C 群流脑多糖疫苗',
    doseLabel: '第 1 剂',
    targetMonths: 36,
    ageLabel: '36 月龄',
    note: '3 周岁接种，第 2 剂在 6 周岁接种。',
  },
];
