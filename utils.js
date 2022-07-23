export const addToLocalStorage = (id, values, command) => {
    const newRow={id, values}
    let items=getLocalStorage(command)
    items.push(newRow)
    localStorage.setItem(command, JSON.stringify(items))
}
export const getLocalStorage = (command) => {
    if(localStorage.getItem(command)){
        return JSON.parse(localStorage.getItem(command))
    }
    return []
}
export const editLocalStorage = (id, value, command) => {
    let items=getLocalStorage(command)
    items=items.map(item => {
        if(item.id===id) item.values=value
        return item
    })
    localStorage.setItem(command, JSON.stringify(items))
}
export const removeFromLocalStorage = (id, command) => {
    let items=getLocalStorage(command)
    items=items.filter(item => {
        if(item.id !== id) return item
    })
    localStorage.setItem(command, JSON.stringify(items))
}
export const log = (command) => {
    console.log(command)
}
export const qs = (selector, parent = document) => {
    return parent.querySelector(selector)
}
export const qsa = (selector, parent = document) => {
    return [...parent.querySelectorAll(selector)]
}
export const sanitizeInput = (input) => {
    const div=document.createElement('div')
    div.textContent=input
    return div.innerHTML
}
export const createElement = (type, options = {}) => {
    const element=document.createElement(type)
    Object.entries(options).forEach(([key, value]) => { 
        if(key==='class'){
            element.classList.add(value)
            return
        }
        if(key==='dataset'){
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey]=dataValue
            })
            return
        }
        if(key==='text'){
            element.textContent=value
            return
        }
        element.setAttribute(key, value)
    })
    return element
}
export const deleteAllChildElements = (parentElement) => {
    let child=parentElement.lastElementChild
    while(child){
        parentElement.removeChild(child)
        child=parentElement.lastElementChild
    }
}
const CURRENCY_FORMATTER=new Intl.NumberFormat('zh-TW', {
    style:'currency',
    currency:'TWD',
})
export const formatCurrency = (number) => {
    return CURRENCY_FORMATTER.format(number)
}

const months={
    0: 'January',
    1: 'February',
    2: 'March',
    3: 'April',
    4: 'May',
    5: 'June',
    6: 'July',
    7: 'August',
    8: 'September',
    9: 'October',
    10: 'November',
    11: 'December'
}

export const getMonth = (key) => {
    return months[key]
}

export const convertTime24to12 = (time) => {
    let ts = time;
    const H = +ts.substr(0, 2);
    let h = (H % 12) || 12;
    h = (h < 10)?("0"+h):h;
    const ampm = H < 12 ? " AM" : " PM";
    ts = h + ts.substr(2, 3) + ampm;
    return ts;
}
export const convertTime12to24 = (time12h) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
        hours = '00';
    }
    if (modifier === 'PM') {
        hours = parseInt(hours, 10) + 12;
    }
    return `${hours}:${minutes}`;
}

export const sleep = (duration) => {
    return new Promise(resolve => {
        setTimeout(resolve, duration)
    })
}