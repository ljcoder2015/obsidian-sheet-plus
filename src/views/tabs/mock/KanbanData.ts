export const mockData = {
  tasks: {
    1: {
      rowIndex: 1,
      content: [
        {
          colIndex: 0, // 第一列
          title: '任务名称',
          content: '任务1',
        },
        {
          colIndex: 1,
          title: '任务描述',
          content: '任务1的描述',
        },
        {
          colIndex: 2,
          title: '任务状态',
          content: '进行中',
        },
        {
          colIndex: 3,
          title: '任务时间',
          content: '2023-01-01',
        },
        {
          colIndex: 4,
          title: '任务人',
          content: '张三',
        },
      ],
    },
    2: {
      rowIndex: 2,
      content: [
        {
          colIndex: 0, // 第一列
          title: '任务名称',
          content: '任务2',
        },
        {
          colIndex: 1,
          title: '任务描述',
          content: '任务2的描述',
        },
        {
          colIndex: 2,
          title: '任务状态',
          content: '未开始',
        },
        {
          colIndex: 3,
          title: '任务时间',
          content: '2023-01-01',
        },
        {
          colIndex: 4,
          title: '任务人',
          content: '张三',
        },
      ],
    },
  },
  columns: {
    未开始: {
      id: '未开始',
      title: '未开始',
      taskIds: [2],
    },
    进行中: {
      id: '进行中',
      title: '进行中',
      taskIds: [1],
    },
    未分组: {
      id: '未分组',
      title: '未分组',
      taskIds: [],
    },
  },
  columnOrder: ['未开始', '进行中', '未分组'],
}
