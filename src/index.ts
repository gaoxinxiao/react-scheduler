import './style.css'
import {
    unstable_IdlePriority as IdlePriority, //空闲优先级
    unstable_LowPriority as LowPriority, //低优先级
    unstable_UserBlockingPriority as UseBlockingPriority, //用户阻塞优先级
    unstable_NormalPriority as NormalPriority, //正常优先级
    unstable_ImmediatePriority as ImmediatePriority, //立刻执行的优先级
    unstable_scheduleCallback as scheduleCallback, //调度器
    unstable_cancelCallback as cancelCallback, //取消调度
    unstable_shouldYield as shouldYield, //当前帧是否用尽了
    unstable_getFirstCallbackNode as getFirstCallbackNode, //返回当前第一个正在调度的任务
    CallbackNode
} from 'scheduler'

console.log(IdlePriority, '-------IdlePriority-----空闲优先级')
console.log(LowPriority, '--------LowPriority----低优先级')
console.log(NormalPriority, '-----NormalPriority-------正常优先级')
console.log(UseBlockingPriority, '----UseBlockingPriority--------用户阻塞优先级')
console.log(ImmediatePriority, '------ImmediatePriority------立刻执行的优先级')

interface Work {
    count: number,
    priority: Priority
}

type Priority = typeof IdlePriority | typeof LowPriority | typeof UseBlockingPriority | typeof NormalPriority | typeof ImmediatePriority



//组件队列
const workList: Array<Work> = []

const work:Work = {
    count: 10,
    priority: IdlePriority
}

const priority2UseList: Priority[] = [
    ImmediatePriority,
    UseBlockingPriority,
    NormalPriority,
    LowPriority,

]

const priority2Name = [
    'noop',
    'ImmediatePriority',
    'UseBlockingPriority',
    'NormalPriority',
    'LowPriority',
    'IdlePriority'
]

const rootDOM = document.querySelector('#root')
const contentDOM = document.querySelector('#content')


priority2UseList.forEach(priority => {
    const btnDOM = document.createElement('button')

    btnDOM.innerText = priority2Name[priority] + priority
    rootDOM.appendChild(btnDOM)

    btnDOM.onclick = function () {
        //要更新的组件次数
        const newWork = {
            count: 100,
            priority
        }

        workList.push(newWork)

        //开始执行调度过程
        schduler()
    }
})
//当前被调度的回调函数
let curCallback: CallbackNode | null = null

//本次调度任务进行时，正在执行的调度的优先级
let prevPriority: Priority = IdlePriority

//开始任务调度
function schduler() {
    //step1 获取当前调度的任务
    const cbNode = getFirstCallbackNode()

    //step2 获取优先级最高的任务
    const currWork = workList.sort((w1, w2) => w1.priority - w2.priority)[0]

    if (!currWork) {
        //没有任务了，考虑边界情况没
        curCallback = null
        cbNode && cancelCallback(cbNode)
        return
    }

    const { priority: curPriority } = currWork
    
    //step3 如果最新任务的优先级和当前执行的任务优先级一样就没必要打断当前执行的
    if (prevPriority === curPriority) {
        return
    }
    
    //step4 到了这个位置说明有更高优先级的任务我们需要中断掉当前的任务
    cbNode && cancelCallback(cbNode)

    //step5 开始任务调度执行
    curCallback = scheduleCallback(curPriority, perform.bind(null, currWork))
}


function perform(work: Work, didTimeout?: boolean) {

    //didTimeout 用来返回当前任务是否需要中断掉

    //是否需要同步执行
    const needSync = work.priority === ImmediatePriority || didTimeout

    //shouldYield浏览器是否还有剩余时间
    //每个调度任务过程只有5ms 如果超过5ms shouldYield 就会返回true
    while ((needSync || !shouldYield()) && work.count) {
        work.count--
        insertItem(work.priority + '')
    }

    //两种中断情况
    //1.work.count执行完了也就是说当前组件执行完了
    //2.调度器让我中断任务

    prevPriority = work.priority

    if (!work.count) {
        //当前work执行完了
        const workIndex = workList.indexOf(work)
        workList.splice(workIndex, 1)
        prevPriority = IdlePriority
    }


    const prevCallback = curCallback
    //执行完当前任务继续调度
    schduler()
    const newCallback = curCallback

    if (newCallback && (prevCallback === newCallback)) {
        return perform.bind(null, work)
    }

}

//插入
const insertItem = (content: string) => {
    const ele = document.createElement('span')
    ele.innerText = `${content}`
    ele.className = 'span' + content
    doSomeBuzyWork(10000000)
    contentDOM.appendChild(ele)
}

//阻塞
const doSomeBuzyWork = (len: number) => {
    let result = 0;
    while (len--) {
        result += len;
    }
};
