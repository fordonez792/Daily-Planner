import { log, qs, qsa, createElement, getMonth, sleep, sanitizeInput, convertTime24to12, convertTime12to24, deleteAllChildElements, addToLocalStorage, editLocalStorage, removeFromLocalStorage, getLocalStorage } from "./utils.js"

// Query Selectors
const homeBtn=qs('#home')
const fullTaskContainer=qs('#full-task-container')
const contact=qs('#contact-container')
const sortOptions=qsa('.sort-options li')
const allBtns=qsa('.list')
const tasksContainer=qs('#tasks-container')
const addTaskContainer=qs('#add-task-container')
const sortContainer=qs('#sort-container')
const fullCalendar=qs('#full-calendar-container')
const dropdownOptions=qs('.options')
const calendar=qs('#calendar-container')
const calendarMonth=qs('.this-month h1')
const calendarDate=qs('.this-month p')
const monthDays=qs('.days')
const date=new Date()
// Submit new task
const allTasks=qs('.all-tasks')
const submitBtn=qs('#submit')
const resetBtn=qs('#reset')
const name=qs('#name')
const category=qs('#category')
const startTime=qs('#start-time')
const endTime=qs('#end-time')
const description=qs('#description')

let previouslyOnHome=true
let previouslyEditing=false
let toEdit
let desktop
let hoveringContactInfo=true

// Checking if window has been resized to desktop size
window.addEventListener('resize', () => {
    const selected=qsa('*', calendar).find(item => item.classList.contains('selected')) || qs('#today')
    selected.scrollIntoView({ behavior: "auto", inline: "center" })
    if(window.innerWidth>1200){
        clearWindows()
        desktop=true
        return
    }
    desktop=false
})

// Loading window
window.addEventListener('DOMContentLoaded', () => {
    renderTopCalendar()
    renderCalendar()
    setDateMainWindow()

    // Get id to retrieve all tasks for the given date
    const currentSelectionID=getDateID()
    const tasks=getLocalStorage(currentSelectionID)
    const sort=getLocalStorage('sort')
    // Creates tasks if there are any
    if(tasks.length>0){
        tasks.forEach(task => {
            createTask(task.id, task.values)
        })
    }
    // If list has not been sorted then set as default the sort type
    if(sort.length<1){
        addToLocalStorage(1, 'default', 'sort')
    }
    // Else choose the sort that has been preselected by user and sort accordingly
    else{
        const id=sort[0].values
        sortOptions.forEach(option => {
            if(option.dataset.id!=id)return
            option.classList.add('active')
        })
        selectSort(id)
    }
    homeBtn.classList.add('active')
    updateProgressBar()
    if(window.innerWidth>1200){
        desktop=true
        return
    }
    desktop=false
})

calendar.addEventListener('click', e => {
    const current=e.target
    const today=qs('#today')
    const days=qsa('div', qs('.days'))

    const fullCalendarSelection=days.find(item => {
        if(item.textContent===current.textContent && !item.classList.contains('prev-date')) return item
    }) // selecting same day in the full calendar

    days.forEach(item => {
        if(item.classList.contains('selected')){
            item.classList.remove('selected')
        }
    })

    const selected=qsa('*', calendar).find(item => item.classList.contains('selected')) // selects the div that has the selected class before adding the class to a new div
    const selectedDate=new Date()

    if(current.classList.contains('next') || current.classList.contains('prev')) return

    // Allows for selected date to have a gray color and to be in focus on screen
    if(current!=today){
        if(!current.classList.contains('selected')){
            current.classList.add('selected')
            fullCalendarSelection.classList.add('selected')
            selectedDate.setDate(current.textContent)
            current.scrollIntoView({ behavior: "auto", inline: "center" })
        }
        // If selected date is same as previous one then make selected date current date
        else if(current.classList.contains('selected')){
            current.classList.remove('selected')
            fullCalendarSelection.classList.remove('selected')
            today.scrollIntoView({ behavior: "auto", inline: "center" })
        }
    }
    if(current===today){
        today.scrollIntoView({ behavior: "auto", inline: "center" })
    }
    // If such a div exists, then remove the selected class from it, as it is outdated
    if(selected){
        selected.classList.remove('selected')
    }
    setDateMainWindow(selectedDate)
    appendTasks()
    updateProgressBar()
})

fullCalendar.addEventListener('click', e => {
    const topCalendarDays=qsa('div', calendar)
    const daysContainer=qs('.days')
    const days=qsa('div', daysContainer)
    const current=e.target
    const selectedDate=new Date()

    const month=date.getMonth()
    const currentMonth=new Date().getMonth()
    if(month!=currentMonth) return
    // Selects the same day in the top calendar as the one selected in the full calendar
    const selected=topCalendarDays.find(item => {
        if(item.textContent===current.textContent) return item
    })

    // Removes the selected class from previously selected days, allowing only one div to have the selected class at a time
    topCalendarDays.forEach(item => {
        if(item.classList.contains('selected')){
            item.classList.remove('selected')
        }
    })
    days.forEach(item => {
        if(item.classList.contains('selected')){
            item.classList.remove('selected')
        }
    })

    if(!daysContainer.contains(current) || current.classList.contains('prev-date') || current.classList.contains('next-date')) return
    if(!current.classList.contains('today')){
        current.classList.add('selected')
        selected.classList.add('selected')
        selectedDate.setDate(current.textContent)
    }
    selected.scrollIntoView({ behavior: "auto", inline: "center" })

    appendTasks()
    setDateMainWindow(selectedDate)
    updateProgressBar()
    clearWindows()
    clearNavBtns()
})

// Applies overlay and checkmark for better visibility when task is completed
tasksContainer.addEventListener('click', e => {
    if(!e.target.classList.contains('checkbox'))return
    const currentSelectionID=getDateID()
    const id=e.target.parentElement.dataset.id
    let data=getLocalStorage(currentSelectionID)
    if(data.length>0){
        data=data.filter(item => {
            if(item.id===id) return item
        })
    }
    const parent=e.target.parentElement
    if(parent.dataset.done==='no'){
        const div=createElement('div', {class: 'done'})
        parent.appendChild(div)
        parent.dataset.done='yes'
        data[0].values[5]=true // allows for task to remain checked even if refreshed
    }
    else{
        parent.removeChild(parent.lastElementChild)
        parent.dataset.done='no'
        data[0].values[5]=false
    }
    updateProgressBar()
    editLocalStorage(id, data[0].values, currentSelectionID)
})

// Handles the creating of each task box when information is complete and submit btn is click
submitBtn.addEventListener('click', () => {
    const id=new Date().getTime().toString()
    const sortLS=getLocalStorage('sort')
    const nameValue=sanitizeInput(name.value)
    const categoryValue=sanitizeInput(category.value)
    const startTimeValue=convertTime24to12(sanitizeInput(startTime.value))
    const endTimeValue=convertTime24to12(sanitizeInput(endTime.value))
    const descriptionValue=sanitizeInput(description.value)
    const startHour=parseInt(startTimeValue.slice(0, 2))
    let checked=false
    const values=[nameValue, categoryValue, startTimeValue, endTimeValue, descriptionValue, checked]
    const currentSelectionID=getDateID()

    if(!nameValue || !categoryValue || !startTimeValue || !endTimeValue) return
    if(~startTimeValue.indexOf('AM') && ~endTimeValue.indexOf('AM') && startTimeValue>endTimeValue && startHour!=12) return
    if(~startTimeValue.indexOf('PM') && ~endTimeValue.indexOf('PM') && startTimeValue>endTimeValue && startHour!=12) return
    if(~startTimeValue.indexOf('PM') && ~endTimeValue.indexOf('AM')) return

    clearWindows()
    clearNavBtns()
    if(previouslyEditing){
        const name=qs('div h2', toEdit)
        const start=qs('.start-time', toEdit)
        const end=qs('.end-time', toEdit)

        name.textContent=values[0]
        start.textContent=values[2]
        end.textContent=values[3]

        if(values[1]==='Highest Priority'){
            toEdit.style.setProperty('--color', 'red')
            toEdit.dataset.priority=5
        }
        if(values[1]==='High Priority'){
            toEdit.style.setProperty('--color', 'orange')
            toEdit.dataset.priority=4
        }
        if(values[1]==='Neutral'){
            toEdit.style.setProperty('--color', 'yellow')
            toEdit.dataset.priority=3
        }
        if(values[1]==='Low Priority'){
            toEdit.style.setProperty('--color', 'green')
            toEdit.dataset.priority=2
        }
        if(values[1]==='Lowest Priority'){
            toEdit.style.setProperty('--color', 'blue')
            toEdit.dataset.priority=1
        }

        editLocalStorage(toEdit.dataset.id, values, currentSelectionID)
        selectSort(sortLS[0].values)
        previouslyOnHome=true
        previouslyEditing=false
        return
    }
    updateProgressBar()
    createTask(id, values)
    if(sortLS[0].values!='default'){
        selectSort(sortLS[0].values)
    }
    addToLocalStorage(id, values, currentSelectionID)
    previouslyOnHome=true
})

resetBtn.addEventListener('click', () => {
    name.value=''
    category.value=''
    startTime.value=''
    endTime.value=''
    description.value=''
})

const createTask = (id, values) => {
    const div=createElement('div', {class: 'task', dataset: {done: 'no', id: id}})
    div.innerHTML=`<input type="checkbox" class="checkbox">
                    <div>
                        <h2>${values[0]}</h2>
                        <label><span class="start-time">${values[2]}</span> - <span class="end-time">${values[3]}</span></label>
                    </div>
                    <div class="icons">
                        <ion-icon name="eye-outline" class="view"></ion-icon>
                        <ion-icon name="trash-outline" class="trash"></ion-icon>
                    </div>`
    const iconContainer=qs('.icons', div)
    // Adds correct color coding according to priority chosen
    // Also sets priority data attribute to be used when sorting by priority
    if(values[1]==='Highest Priority'){
        div.style.setProperty('--color', 'red')
        div.dataset.priority=5
    }
    if(values[1]==='High Priority'){
        div.style.setProperty('--color', 'orange')
        div.dataset.priority=4
    }
    if(values[1]==='Neutral'){
        div.style.setProperty('--color', 'yellow')
        div.dataset.priority=3
    }
    if(values[1]==='Low Priority'){
        div.style.setProperty('--color', 'green')
        div.dataset.priority=2
    }
    if(values[1]==='Lowest Priority'){
        div.style.setProperty('--color', 'blue')
        div.dataset.priority=1
    }
    allTasks.appendChild(div)

    // Functionality for trash icon on each task
    const deleteTask=qs('.trash', iconContainer)
    deleteTask.addEventListener('click', e => {
        const currentSelectionID=getDateID()
        const toDelete=e.currentTarget.parentElement.parentElement
        allTasks.removeChild(toDelete)
        updateProgressBar()
        removeFromLocalStorage(toDelete.dataset.id, currentSelectionID)
    })

    // Functionality for eye icon on each task, creating a window to display info
    const viewTask=qs('.view', iconContainer)
    viewTask.addEventListener('click', e => {
        toEdit=e.currentTarget.parentElement.parentElement
        const selectedDateID=getDateID()
        let task=getLocalStorage(selectedDateID)
        task=task.filter(item => {
            if(item.id===toEdit.dataset.id) return item
        })
        const data=task[0].values

        const header=qs('.header', fullTaskContainer)
        const priority=qs('#priority', fullTaskContainer)
        const start=qs('#start', fullTaskContainer)
        const end=qs('#end', fullTaskContainer)
        const p=qs('p', fullTaskContainer)
        const editBtn=qs('.edit-btn', fullTaskContainer)

        // Setting values in new window
        p.textContent=''
        header.textContent=data[0]
        priority.textContent=data[1]
        if(data[1]==='Highest Priority'){
            fullTaskContainer.style.setProperty('--color', 'red')
        }
        if(data[1]==='High Priority'){
            fullTaskContainer.style.setProperty('--color', 'orange')
        }
        if(data[1]==='Neutral'){
            fullTaskContainer.style.setProperty('--color', 'yellow')
        }
        if(data[1]==='Low Priority'){
            fullTaskContainer.style.setProperty('--color', 'green')
        }
        if(data[1]==='Lowest Priority'){
            fullTaskContainer.style.setProperty('--color', 'blue')
        }

        start.textContent=data[2]
        end.textContent=data[3]
        if(data[4]){
            p.textContent=data[4]
        }
        overlay.classList.add('active')
        fullTaskContainer.classList.add('active')
        previouslyOnHome=false

        editBtn.addEventListener('click', () => {
            clearWindows()
            if(!desktop){
                log(desktop)
                sleep(200).then(() => {
                    openWindow(addTaskContainer)
                })
                clearNavBtns(qs('#add-task'))
            }
            name.value=data[0]
            category.value=data[1]
            startTime.value=convertTime12to24(data[2])
            endTime.value=convertTime12to24(data[3])
            if(data[4]){
                description.value=data[4]
            }
            previouslyEditing=true
        })
    })

    // Allows for the checked to remain checked after refresh
    const checkbox=qs('.checkbox', div)
    if(values[5] && div.dataset.done==='no'){
        const temp=createElement('div', {class: 'done'})
        div.appendChild(temp)
        div.dataset.done='yes'
        checkbox.checked=true
    }

    name.value=''
    category.value=''
    startTime.value=''
    endTime.value=''
    description.value=''
}

// Left and right arrows for the big complete calendar
const leftArrow=qs('.prevMonth')
leftArrow.addEventListener('click', () => {
    date.setMonth(date.getMonth()-1)
    renderCalendar()
})
const rightArrow=qs('.nextMonth')
rightArrow.addEventListener('click', () => {
    date.setMonth(date.getMonth()+1)
    renderCalendar()
})

// Allows for calendar to be created dynamically according to the month
const renderCalendar = () => {
    date.setDate(1)
    const month=date.getMonth()
    const readableDate=new Date().toDateString()
    const lastDay=new Date(date.getFullYear(), date.getMonth()+1, 0).getDate()
    const prevLastDay=new Date(date.getFullYear(), date.getMonth(), 0).getDate()
    const lasDayIndex=new Date(date.getFullYear(), date.getMonth()+1, 0).getDay()
    const firstDay=date.getDay()
    const nextDays=7-lasDayIndex-1
    calendarMonth.textContent=getMonth(month)
    calendarDate.textContent=readableDate
    let days=''
    for(let i=firstDay; i>0; i--){
        days+=`<div class="prev-date">${prevLastDay-i+1}</div>`
    }
    for(let i=1; i<=lastDay; i++){
        if(i===new Date().getDate() && month===new Date().getMonth()){
            days+=`<div class="today">${i}</div>`
        }
        else{
            days+=`<div>${i}</div>`
        }
        monthDays.innerHTML=days
    }
    for(let i=1; i<=nextDays; i++){
        days+=`<div class="next-date">${i}</div>`
        monthDays.innerHTML=days
    }
}

// Allows for only 1 btn to be active at a time
const nav=qs('.navigation')
nav.addEventListener('click', e => {
    const id=e.target.id
    const delay=200
    if(!id) return
    if(previouslyOnHome){
        clearNavBtns(e.target)
    }
    else{
        sleep(delay).then(() => {
            clearNavBtns(e.target)
        })
    }
    if(id==='home'){
        clearWindows()
        clearNavBtns(e.target)
        previouslyOnHome=true
        return
    }
    if(id==='add-task'){
        clearWindows()
        if(previouslyOnHome){
            openWindow(addTaskContainer)
        }
        else{
            sleep(delay).then(() => {
                openWindow(addTaskContainer)
            })
        }
        previouslyOnHome=false
    }
    if(id==='sort'){
        clearWindows()
        if(previouslyOnHome){
            openWindow(sortContainer)
        }
        else{
            sleep(delay).then(() => {
                openWindow(sortContainer)
            })
        }
        previouslyOnHome=false
    }
    if(id==='calendar'){
        clearWindows()
        if(previouslyOnHome){
            openWindow(fullCalendar)
        }
        else{
            sleep(delay).then(() => {
                openWindow(fullCalendar)
            })
        }
        previouslyOnHome=false
    }
})
// Checks if mouse is hovering the contact information or not
contact.addEventListener('mouseleave', () => {
    hoveringContactInfo=false
    contact.classList.remove('active')
})
contact.addEventListener('mouseover', () => {
    hoveringContactInfo=true
})
// Activates the contact info window once it reaches farthest right around the middle
document.addEventListener('mousemove', e => {
    if((e.clientX===(window.innerWidth-1) && e.clientY<500 && e.clientY>275) ||hoveringContactInfo){
        contact.classList.add('active')
        return
    }
    contact.classList.remove('active')
})

// Reveals dropdown menu
document.addEventListener('click', e => {
    const isDropDownBtn=e.target.matches('[data-dropdown-btn]')
    if(!isDropDownBtn && e.target.closest('[data-dropdown]')) return
    let currentDropdown
    if(isDropDownBtn){
        currentDropdown=e.target.closest('[data-dropdown]')
        currentDropdown.classList.toggle('active')
    }
    document.querySelectorAll('[data-dropdown].active').forEach(dropdown => {
        if(dropdown===currentDropdown)return
        dropdown.classList.remove('active')
    })
})

dropdownOptions.addEventListener('click', e => {
    category.value=e.target.textContent
    window.dataID=e.target.dataset.id
    category.readOnly=true
})

// Restricts input to only the ones inside the dropdown menu
document.addEventListener('mouseup', e => {
    const clicked=e.target
    if(clicked===category){
        category.readOnly=true
        return
    }
    category.readOnly=false
})

// Make sorting options active
const sortList=qs('.sort-options')
sortList.addEventListener('click', e => {
    const id=e.target.dataset.id
    sortOptions.forEach(option => {
        option.classList.remove('active')
    })
    e.target.classList.add('active')
    // Adding the sort option selected so that if refreshed it will remain sorted
    const sortLS=getLocalStorage('sort')
    if(sortLS.length<1){
        addToLocalStorage(1, id, 'sort')
    }
    else{
        editLocalStorage(1, id, 'sort')
    }
    selectSort(id)
})

// Helper function that determines the type of sort to complete
const selectSort = (id) => {
    // Collect tasks, filter and convert into array
    let tasksTemp=qsa('*', allTasks)
    tasksTemp=tasksTemp.filter(item => {
        if(item.classList.contains('task')) return item
    })
    const tasksArray=Array.from(tasksTemp)
    if(tasksArray.length<2) return
    if(id==='default'){
        defaultSort()
    }
    if(id==='by-time'){
        timeSort(tasksArray)
    }
    if(id==='by-priority'){
        timeSort(tasksArray)
        prioritySort(tasksArray)
    }
    // Deletes all children and appends them back again but in the sorted order
    if(id!='default'){
        deleteAllChildElements(allTasks)
        for(let i=0; i<tasksArray.length; i++){
            allTasks.appendChild(tasksArray[i])
        }
    }
    clearWindows()
    clearNavBtns()
}

// Function to sort by adding time, default sort
const defaultSort = () => {
    const currentSelectionID=getDateID()
    const items=getLocalStorage(currentSelectionID)
    deleteAllChildElements(allTasks)
    items.forEach(item => {
        createTask(item.id, item.values)
    })
}

// Function to sort by time on each task
const timeSort = (array) => {
    array.sort((a, b) => {
        const aStartTime=qs('.start-time', a).textContent
        const bStartTime=qs('.start-time', b).textContent
        // Starting hour and minute
        const aStartHour=parseInt(aStartTime.slice(0, 2))
        const bStartHour=parseInt(bStartTime.slice(0, 2))
        const aStartMin=parseInt(aStartTime.slice(3, 5))
        const bStartMin=parseInt(bStartTime.slice(3, 5))
        // If both times are either AM or PM then they sort same way
        if((~aStartTime.indexOf('AM') && ~bStartTime.indexOf('AM')) || (~aStartTime.indexOf('PM') && ~bStartTime.indexOf('PM'))){
            // If hour is same then sort by minute
            if(aStartHour===bStartHour){
                // If they also got same minute, sort by priority
                if(aStartMin===bStartMin){
                    const aPriority=a.dataset.priority
                    const bPriority=b.dataset.priority
                    if(aPriority>bPriority) return -1
                    if(bPriority>aPriority) return 1
                    return 0
                }
                if(aStartMin>bStartMin) return 1
                if(aStartMin<bStartMin) return -1
            }
            // Sorting first if the hour is 12
            if(aStartHour===12) return -1
            if(bStartHour===12) return 1
            // Otherwise sort normal from least to greatest
            if(aStartHour>bStartHour) return 1
            if(aStartHour<bStartHour) return -1
        }
        if(~aStartTime.indexOf('AM') && ~bStartTime.indexOf('PM')) return -1
        if(~aStartTime.indexOf('PM') && ~bStartTime.indexOf('AM')) return 1
    })
}

// Function to sort by priority
const prioritySort =(array) => {
    array.sort((a, b) => {
        const aPriority=a.dataset.priority
        const bPriority=b.dataset.priority
        if(aPriority>bPriority) return -1
        if(bPriority>aPriority) return 1
        return 0
    })
}

// Set today's date on main window
const setDateMainWindow = (date = new Date()) => {
    const thisMonth=qs('.month')
    const thisDate=qs('.day')
    const temp=date.getMonth()
    const month=getMonth(temp)
    thisMonth.textContent=month
    thisDate.textContent=date.toDateString()
}

// Makes progress bar dynamic according to percentage of work completed
const updateProgressBar = () => {
    let allChildren=qsa('*', parent.parentElement)
    const percentage=qs('.percentage')
    const progressBar=qs('.progress-bar')
    let count=0
    allChildren=allChildren.filter(child => {
        if(child.dataset.done==='yes') count++
        if(child.classList.contains('task')) return child
    })
    const total=allChildren.length
    if(count===0 && total===0){
        percentage.textContent=100
        progressBar.style.setProperty('--progress', 100+'%')
        return
    }
    const num=count/total*100
    if(num%1!=0){
        percentage.textContent=num.toFixed(2)
        progressBar.style.setProperty('--progress', num.toFixed(2)+'%')
    }
    else{
        percentage.textContent=num
        progressBar.style.setProperty('--progress', num+'%')
    }
}

// returns an id for the selected date in appropriate format to use for local storage api
const getDateID = (date = new Date()) => {
    const selected=qs('.selected', calendar) || qs('#today', calendar)
    date.setDate(selected.textContent)
    const day=String(date.getDate()).padStart(2, '0')
    const month=String(date.getMonth()+1).padStart(2, '0')
    const year=date.getFullYear().toString()
    const current=day+month+year
    return current
}

// Dynamically creates the top calendar
const renderTopCalendar = () => {
    const lastDay=new Date(date.getFullYear(), date.getMonth()+1, 0).getDate()
    for(let i=1; i<=lastDay; i++){
        const div=createElement('div', {text: i})
        if(i===1){
            div.classList.add('width')
        }
        if(i===new Date().getDate()){
            div.setAttribute('id', 'today')
        }
        if(i===lastDay){
            const temp=qs('#today')
            temp.scrollIntoView({ behavior: "auto", inline: "center" })
        }
        calendar.appendChild(div)
    }
}

// Function allows for collection of tasks for selected date and appends them aswell
const appendTasks = () => {
    const sortLS=getLocalStorage('sort')
    const id=sortLS[0].values
    const currentSelectionID=getDateID()
    const tasks=getLocalStorage(currentSelectionID)
    deleteAllChildElements(allTasks)
    tasks.forEach(item => {
        createTask(item.id, item.values)
    })
    selectSort(id)
}

// If click on overlay then close windows
const overlay=qs('#overlay')
overlay.addEventListener('click', () => {
    clearWindows()
    clearNavBtns()
    previouslyOnHome=true
})

// Go back button functionality
const goBack=qsa('.go-back')
goBack.forEach(btn => {
    btn.addEventListener('click', () => {
        clearWindows()
        clearNavBtns()
    })
    previouslyOnHome=true
})

// Move 1 to the right in the calendar
const nextArrow=qs('.next')
nextArrow.addEventListener('click', () => {
    const width=qs('.width').offsetWidth
    calendar.scrollLeft+=width
})

// Move 1 to the left in the calendar
const prevArrow=qs('.prev')
prevArrow.addEventListener('click', () => {
    const width=qs('.width').offsetWidth
    calendar.scrollLeft-=width
})

// Function to open window
const openWindow = (temp) => {
    temp.classList.add('active')
    overlay.classList.add('active')
    if(!temp.classList.contains('active')){
        overlay.classList.remove('active')
    }
}

// Function to clear all windows when button is clicked
const clearWindows = () => {
    if(addTaskContainer.classList.contains('active')){
        addTaskContainer.classList.remove('active')
    }
    if(sortContainer.classList.contains('active')){
        sortContainer.classList.remove('active')
    }
    if(fullCalendar.classList.contains('active')){
        fullCalendar.classList.remove('active')
    }
    if(fullTaskContainer.classList.contains('active')){
        fullTaskContainer.classList.remove('active')
    }
    if(overlay.classList.contains('active')){
        overlay.classList.remove('active')
    }
}

// Remove active class from all nav buttons and set home or other as active
const clearNavBtns = (temp = homeBtn) => {
    allBtns.forEach(btn => {
        btn.classList.remove('active')
    })
    temp.classList.add('active')
}
// Auto resize textarea