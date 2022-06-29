
//window.checkinTime = "8:00"
//window.checkoutTime = "16:20"

window.checkinTime = new Date();
window.checkinTime.setHours(8,0,0,0);
window.checkoutTime = new Date();
window.checkoutTime.setHours(16,20, 0, 0);


function simulateMouseClick(targetNode) {
    function triggerMouseEvent(targetNode, eventType) {
        let clickEvent = new MouseEvent(eventType, {bubbles: true, cancelable: true});
        //let clickEvent = document.createEvent('MouseEvents');
        //clickEvent.initEvent(eventType, true, true);
        targetNode.dispatchEvent(clickEvent);
    }
    targetNode.focus();
    ["mouseover", "mousedown", "mouseup", "click"].forEach(function(eventType) { 
        triggerMouseEvent(targetNode, eventType);
    });
}

function getInput(eventRows, name, type) {
    let lastEventRow = eventRows[eventRows.length - 1];
    let timeAddDiv = lastEventRow.getElementsByClassName(name)[0]
    let input = timeAddDiv.getElementsByTagName(type)[0];
    return input;
}

let timeDiv = document.getElementsByClassName("k-virtual-scrollable-wrap")[0]
let rows = timeDiv.getElementsByTagName("tr")
let row = rows[0]
let eventCol = row.getElementsByTagName("td")[1];
let timeButton = eventCol.getElementsByTagName("i")[0]

simulateMouseClick(timeButton);

let eventAddDiv = document.getElementsByClassName("modal-dialog")[0];
let faPlus = eventAddDiv.getElementsByClassName("fa-plus")[0];

faPlus.click()
let eventTable = eventAddDiv.getElementsByTagName("table")[1];
let eventRows = eventTable.getElementsByTagName("tr");

timeInput = $("td.ido:last input:last").data("kendoTimePicker")
timeInput.value(window.checkinTime);
timeInput.trigger("change");

typeOption = $("td.tipus:last select:last")
typeOption.data("kendoDropDownList").value(0)
//!typeOption.trigger("change")

faPlus.click()

timeInput = $("td.ido:last input:last").data("kendoTimePicker")
timeInput.value(window.checkoutTime);
timeInput.trigger("change");

typeOption = $("td.tipus:last select:last")
typeOption.data("kendoDropDownList").value(1)
//typeOption.trigger("change")

let footer = eventAddDiv.getElementsByClassName("modal-footer")[0];
let saveButton = footer.getElementsByTagName("button")[0]
simulateMouseClick(saveButton);


for(let row of rows) {
    if ( row.classList.contains("munkaszuneti-nap")) {
        continue;
    }
    let eventCol = row.getElementsByTagName("td")[1];

    console.log(row);
}


ctrl = angular.element(document.body).controller()
ctrlJelenleti = angular.element(document.getElementsByClassName("felosztott-ido-icon")[0]).controller()
hrRelationshipId = ctrlJelenleti.hrRelationshipId
datum = ctrlJelenleti.days[0].datum

function getJelenletiController() {
    let ctrlJelenleti = angular.element(document.getElementsByClassName("felosztott-ido-icon")[0]).controller();
    return ctrlJelenleti;
}
function getDay(dayIndex) {
    let ctrlJelenleti = getJelenletiController();
    let day = ctrlJelenleti.days[dayIndex]
    return day;
}



function reportTime(dayIndex, checkin, checkout) {
    function createUpdateQuery(dayIndex, checkin, checkout) {
        let ctrlJelenleti = getJelenletiController()
        checkin = checkin !== undefined ? checkin : { hours: 8, minutes: 0};
        checkout = checkout !== undefined ? checkout : { hours: 16, minutes: 20};
    
        
        let day = getDay(dayIndex);
        
        let checkinTime =  new Date(day.datum);
        checkinTime.setHours(checkin.hours + 2, checkin.minutes);
        
        let checkoutTime =  new Date(day.datum);
        checkoutTime.setHours(checkout.hours + 2, checkout.minutes);
    
        let queryJson = {
            "hrRelationshipId": ctrlJelenleti.hrRelationshipId,
            "datum": day.datum,
            "esemenyek": [
                {
                    "guid": ctrlJelenleti.nxnGuid.newGuid(),
                    "id": Math.floor((1 + Math.random()) * 65536),
                    "rowVersion": "",
                    "jelleg": 2,
                    "idopont": checkinTime.getTime(),
                    "tipus": 0,
                    "torolt": false
                },
                {
                    "guid": ctrlJelenleti.nxnGuid.newGuid(),
                    "id": Math.floor((1 + Math.random()) * 65536),
                    "rowVersion": "",
                    "jelleg": 2,
                    "idopont": checkoutTime.getTime(),
                    "tipus": 1, // kilepes
                    "torolt": false
                }
            ]
        }
        return queryJson;
    }
    $.ajax("https://nexonport.beko.hu/time/api/jelenletiiv/sajat/esemenyekMenteseCommand?r=6", {
        data : JSON.stringify(createUpdateQuery(dayIndex, checkin, checkout)),
        contentType : 'application/json;charset=UTF-8',
        type : 'POST'
    })
}

class nexonHackController {
    constructor(){
        this.ctrl = angular.element(document.getElementsByClassName("felosztott-ido-icon")[0]).controller();
        this.hrRelationshipId = this.ctrl.hrRelationshipId
    }
    newGuid() {
        return this.ctrl.nxnGuid.newGuid();
    }
    getDay(dayIndex) {
        return this.ctrl.days[dayIndex]
    }
    getDayType(day) {
        if(Number.isInteger(day)) {
            day = this.getDay(day)
        }
        return Nexon.Time.NapJellegEnum[day.jelleg]
    }
    isWorkingDay(day) {
        return getDayType(day) === "Munkanap";

    }
    createQueryBaseObject(dayIndex) {
        let day = this.getDay(dayIndex)
        let queryObject = {
            "hrRelationshipId": this.hrRelationshipId,
            "datum": day.datum,
            "esemenyek": []
        }
        return queryObject;
    }
    createFelosztas(dayIndex) {
        let query = {
            "jogviszonyAzonosito": this.hrRelationshipId, // I'm not sure
            "nap": this.getDay(dayIndex).datum,
            "idofelosztasok": []
        }
        return query;
    }
    async deleteFelosztas(dayIndex) {
        let queryObj = this.createFelosztas(dayIndex);
        return await $.ajax("https://nexonport.beko.hu/time/api/jelenletiiv/sajat/egyeniIdofelosztasModositasaCommand?r=6", {
            data : JSON.stringify(queryObj),
            contentType : 'application/json;charset=UTF-8',
            type : 'POST'
        })
    }
    async deleteEvent(dayIndex) {
        let queryObj = this.createQueryBaseObject(dayIndex)
        return await $.ajax("https://nexonport.beko.hu/time/api/jelenletiiv/sajat/esemenyekMenteseCommand?r=6", {
            data : JSON.stringify(queryObj),
            contentType : 'application/json;charset=UTF-8',
            type : 'POST'
        })
    }
    async reportTime(dayIndex, checkin, checkout) {
        checkin = checkin !== undefined ? checkin : { hours: 8, minutes: 0};
        checkout = checkout !== undefined ? checkout : { hours: 16, minutes: 20};

        let day = this.getDay(dayIndex)

        let checkinTime =  new Date(day.datum);
        checkinTime.setHours(checkin.hours + 2, checkin.minutes);
        
        let checkoutTime =  new Date(day.datum);
        checkoutTime.setHours(checkout.hours + 2, checkout.minutes);

        let queryJson = this.createQueryBaseObject(dayIndex)
        queryJson.esemenyek = [
            {
                "guid": this.newGuid(),
                "id": Math.floor((1 + Math.random()) * 65536),
                "rowVersion": "",
                "jelleg": 2,
                "idopont": checkinTime.getTime(),
                "tipus": 0,
                "torolt": false
            },
            {
                "guid": this.newGuid(),
                "id": Math.floor((1 + Math.random()) * 65536),
                "rowVersion": "",
                "jelleg": 2,
                "idopont": checkoutTime.getTime(),
                "tipus": 1, // kilepes
                "torolt": false
            }
        ]
        
        return await $.ajax("https://nexonport.beko.hu/time/api/jelenletiiv/sajat/esemenyekMenteseCommand?r=6", {
            data : JSON.stringify(queryJson),
            contentType : 'application/json;charset=UTF-8',
            type : 'POST'
        })
    }
    async deleteAndReportTime(dayIndex, checkin, checkout){
        try {
            console.log(await this.deleteEvent(dayIndex));
        } catch(e){ console.log(e)}
        try {
            console.log(await this.deleteFelosztas(dayIndex));
        } catch{ console.log(e)}
        try {
            console.log(await this.reportTime(dayIndex, checkin, checkout));
        } catch{ console.log(e)}
    }
}

c = new nexonHackController();
function testDeleteEvent(start, end, onlyWorkingDay) {
    c = new nexonHackController();
    end = ( end !== undefined) ? end : start + 1;
    onlyWorkingDay = ( onlyWorkingDay !== undefined) ? onlyWorkingDay : true;

    for(let i = start; i < end; i++) {
        
    }
}
/*
for(let i = 0; i < 10; ++i) {
    if(c.getDayType(c.getDay(i)) === "Munkanap") {
        console.log(i)
        await c.deleteEvent(i);
        await c.deleteFelosztas(i);
    }
}
*/
for(let i = 0; i < 10; ++i) {
    if(c.getDayType(c.getDay(i)) === "Munkanap") {
        console.log(i)
        c.deleteAndReportTime(i)
    }
}

for(let i = 0; i< 21; ++i){
    c.deleteEvent(i);
}

console.log("ready")

console.log(c.getDay(0))
console.log(c.getDay(1))

console.log(c.hrRelationshipId)

console.log(c.newGuid())
console.log(c.createQueryBaseObject(0))
//c.deleteEvent(0)
c.deleteEvent(0)
