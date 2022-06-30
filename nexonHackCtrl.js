window.hackDebug = false;

function debugLog() {
    if(window.hackDebug) {
        return console.log.apply(console, arguments)
    }
}

class TheNexonHackController {
    constructor() {
        if (! TheNexonHackController._instance ) {
            this.ctrl = angular.element(document.getElementsByClassName("felosztott-ido-icon")[0]).controller();
            this.hrRelationshipId = this.ctrl.hrRelationshipId
            TheNexonHackController._instance = this;
          }
          return TheNexonHackController._instance;
        
    }
    newGuid() {
        return this.ctrl.nxnGuid.newGuid();
    }
    getDay(dayIndex) {
        // Hack: if dayIndex is already a day it will return with that.
        if(dayIndex.$type !== undefined && dayIndex.$type.startsWith("Nexon.Time.Api.Jelenlet.Models.JelenletiIvNap")) {
            return dayIndex
        }
        return this.ctrl.days[dayIndex]
    }
    getDayType(day) {
        day = this.getDay(day)
        return Nexon.Time.NapJellegEnum[day.jelleg]
    }
    isEmptyDay(day) {
        day = this.getDay(day);
        const startOfPresentColomnId = 21;
        return day.oszlopok[startOfPresentColomnId] === undefined;
    }
    isWorkingDay(day) {
        return this.getDayType(day) === "Munkanap";

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
    createTimeDevisionQueryBaseObject(dayIndex) {
        let query = {
            "jogviszonyAzonosito": this.hrRelationshipId, // I'm not sure
            "nap": this.getDay(dayIndex).datum,
            "idofelosztasok": []
        }
        return query;
    }
    async deleteTimeDevision(dayIndex) {
        let queryObj = this.createTimeDevisionQueryBaseObject(dayIndex);
        return await $.ajax("/time/api/jelenletiiv/sajat/egyeniIdofelosztasModositasaCommand?r=6", {
            data : JSON.stringify(queryObj),
            contentType : 'application/json;charset=UTF-8',
            type : 'POST'
        })
    }
    async deleteEvent(dayIndex) {
        let queryObj = this.createQueryBaseObject(dayIndex)
        return await $.ajax("/time/api/jelenletiiv/sajat/esemenyekMenteseCommand?r=6", {
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
        
        return await $.ajax("/time/api/jelenletiiv/sajat/esemenyekMenteseCommand?r=6", {
            data : JSON.stringify(queryJson),
            contentType : 'application/json;charset=UTF-8',
            type : 'POST'
        })
    }
    async deleteAndReportTime(dayIndex, checkin, checkout){
        try {
            debugLog(await this.deleteEvent(dayIndex));
        } catch(e){ debugLog(e)}
        try {
            debugLog(await this.deleteTimeDevision(dayIndex));
        } catch(e){ debugLog(e)}
        try {
            debugLog(await this.reportTime(dayIndex, checkin, checkout));
        } catch(e){ debugLog(e)}
    }
}

function testSingleton() {
    let c1 = new TheNexonHackController();
    let c2 = new TheNexonHackController();
    if(c1 === c2 && c1 == c2){
        debugLog("testSingleton", "Test Passed")
    } else {
        debugLog("testSingleton", "Test failed")
    }

}

function testGetDay() {
    let c = new TheNexonHackController();
    debugLog("testGetDay", c.getDay(1))
}

function testGetDayType() {
    let c = new TheNexonHackController();
    let dType = c.getDayType(1)
    debugLog("testGetDayType",  dType === "Munkanap")
}
function testIsWorkingDay() {
    let c = new TheNexonHackController();
    debugLog("testIsWorkingDay", c.isWorkingDay(1))
}


async function testDeleteEvent(start, end, onlyWorkingDay) {
    let testName = "testDeleteEvent";
    end = ( end !== undefined) ? end : start + 1;
    onlyWorkingDay = ( onlyWorkingDay !== undefined) ? onlyWorkingDay : true;

    let c = new TheNexonHackController();
    debugLog(testName, "start")
    for(let i = start; i < end; i++) {
        if(!onlyWorkingDay || (onlyWorkingDay && c.isWorkingDay(i))) {
            debugLog(testName, i)
            await c.deleteEvent(i)
        }
        
    }
    debugLog(testName, "end")
}

async function testdeleteTimeDevision(start, end, onlyWorkingDay) {
    let testName = "testdeleteTimeDevision";
    end = ( end !== undefined) ? end : start + 1;
    onlyWorkingDay = ( onlyWorkingDay !== undefined) ? onlyWorkingDay : true;

    let c = new TheNexonHackController();
    debugLog(testName, "start")
    for(let i = start; i < end; i++) {
        if(!onlyWorkingDay || (onlyWorkingDay && c.isWorkingDay(i))) {
            debugLog(testName, i)
            await c.deleteTimeDevision(i)
        }
        
    }
    debugLog(testName, "end")
}

async function testReportTime(start, end, onlyWorkingDay) {
    let testName = "testReportTime";
    end = ( end !== undefined) ? end : start + 1;
    onlyWorkingDay = ( onlyWorkingDay !== undefined) ? onlyWorkingDay : true;

    let c = new TheNexonHackController();
    debugLog(testName, "start")
    for(let i = start; i < end; i++) {
        if(!onlyWorkingDay || (onlyWorkingDay && c.isWorkingDay(i))) {
            debugLog(testName, i, await c.reportTime(i))
        }
        
    }
    debugLog(testName, "end")
}

async function testDeleteAndReportTime(start, end, onlyWorkingDay) {
    let testName = "testDeleteAndReportTime";
    end = ( end !== undefined) ? end : start + 1;
    onlyWorkingDay = ( onlyWorkingDay !== undefined) ? onlyWorkingDay : true;

    let c = new TheNexonHackController();
    debugLog(testName, "start")
    for(let i = start; i < end; i++) {
        if(!onlyWorkingDay || (onlyWorkingDay && c.isWorkingDay(i))) {
            debugLog(testName, i, await c.deleteAndReportTime(i))
        }
        
    }
    debugLog(testName, "end")
}

// testSingleton()
// testGetDay()
// testGetDayType()
// testIsWorkingDay()
// testDeleteEvent(0, 3)
// testdeleteTimeDevision(0, 3)
// testReportTime(0, 3)
// testDeleteAndReportTime(21)


class UI {
    render() {
        this.c = new TheNexonHackController()
        this.renderMainButtons()
        this.renderHeader()
        this.renderRows()
    }
    renderMainButtons() {
        if($("#hack-main-buttons").length !== 0) {
            return;
        }
        let self = this
        function createOnChange(selector) {
            return function (e) {
                $(selector).each(function () {
                    debugLog(e.target.checked, $(this).attr("value"))
                    $(this).attr("checked", e.target.checked)
                })
            }
        }
        $("#hack-header").prepend($("<span>").attr("id", "hack-main-buttons")
        .append(
            $("<input>").attr("type", "checkbox").attr("id", "hack-chkbox-workingday-emptyday-all").change(createOnChange(".hack-chkbox-workingday.hack-chkbox-emptyday"))
        ).append(
            " All empty workday "
        ).append(
            $("<input>").attr("type", "checkbox").attr("id", "hack-chkbox-workingday-filledday-all").change(createOnChange(".hack-chkbox-workingday.hack-chkbox-filledday"))
        ).append(
            " All filled workday "
        ).append(
            $("<input>").attr("type", "checkbox").attr("id", "hack-day-all").change(createOnChange(".hack-chkbox-workingday"))
        ).append(
            " All workday "
        ).append(
         "| Checkin time: "
        ).append(
            $("<input>").attr("id", "hack-chkintime").val("08:00")
        ).append(
            " Checkout time: "
        ).append(
            $("<input>").attr("id", "hack-chkouttime").val("16:20")
        ).append(
            $("<button>").html("Set time").addClass("hack-ctrl-btn").attr("id", "hack-set-time-btn").click(async function () {
                self.disableCtrlButtons()
                let checkinDateTime = $("#hack-chkintime").data("kendoTimePicker").value()
                let checkinTime = { hours: checkinDateTime.getHours(),  minutes: checkinDateTime.getMinutes()}
                let checkoutDateTime = $("#hack-chkouttime").data("kendoTimePicker").value()
                let checkoutTime = { hours: checkoutDateTime.getHours(),  minutes: checkoutDateTime.getMinutes()}
                debugLog(checkinTime)
                debugLog(checkoutTime)
                try {
                    let chkboxes = $(".hack-chkbox:checked");
                    for(let i = 0; i < chkboxes.length; i++) {
                        let dayId = Number(chkboxes.eq(i).val());
                        self.message("Save starting... day: ", dayId + 1)
                        try {
                            await self.c.deleteAndReportTime(dayId, checkinTime, checkoutTime)
                            self.message("Save ending... day: ", dayId + 1)
                        } catch(e) {
                            self.message("Save error... day: ", dayId + 1, "error:", e.toString())
                        }
                        
                    }
                    self.message("done")
                } catch(e) {
                    self.message(e)
                }
                self.c.ctrl.loadJelenletiIvTable()
                self.enableCtrlButtons()
            })
        ).append(
            " "
        ).append(
            $("<button>").html("Delete  time").addClass("hack-ctrl-btn").attr("id", "hack-delete-time-btn").click(async function () {
                self.disableCtrlButtons()
                try {
                    let chkboxes = $(".hack-chkbox:checked");
                    for(let i = 0; i < chkboxes.length; i++) {
                        let dayId = Number(chkboxes.eq(i).val());
                        self.message("Delete time starting... day: ", dayId + 1)
                        try {
                            await self.c.deleteEvent(dayId)
                            self.message("Delete time ending... day: ", dayId + 1)
                        }
                        catch(e){
                            self.message("Delete time error... day: ", dayId + 1, "error:", e.toString())
                        }
                        self.message("Delete time ratio starting... day: ", dayId + 1)
                        try {
                            await self.c.deleteTimeDevision(dayId)
                        } catch {
                            self.message("Delete time ratio ending... day: ", dayId + 1)
                        }

                    }
                    self.message("done")
                } catch(e) {
                    self.message(e)
                }
                self.c.ctrl.loadJelenletiIvTable()
                self.enableCtrlButtons()
            })
        ).append(
            " "
        ).append(
            $("<span>").attr("id", "hack-status-div")
        ))
        $("#hack-chkintime").kendoTimePicker({
            format: "H:mm",
            dateInput: true,
            culture: "hu-HU"
        })
        $("#hack-chkouttime").kendoTimePicker({
            format: "H:mm",
            dateInput: true,
            culture: "hu-HU"
        })
        
    }
    disableCtrlButtons() {
        $(".hack-ctrl-btn").each(function() {
            $(this).attr("disabled", true)
        })
    }
    enableCtrlButtons() {
        $(".hack-ctrl-btn").each(function() {
            $(this).removeAttr("disabled")
        })
    }
    renderHeader() {
        if($("#hack-table-header").length !== 0) {
            return;
        }
        let header = $(".k-grid-header-wrap:first tr:first th:first")
        header.before($("<th>").attr("id", "hack-table-header"))
    }
    renderRows() {
        let self = this;
        if($(".hack-chkbox").length !== 0) {
            return;
        }
        $(".k-grid-content:first table:first tr").each( function(i) {
            self.renderRow(i, $( this ))
            //this.renderRow(i, )
        })

    }
    renderRow(i, element) {
        debugLog(element)
        this.renderChkboxTd(i, element)
    }
    renderChkboxTd(i, element) {
        let tdFirst = element.find("td:first")
        let newTd = $("<td>")
        let day = this.c.getDay(i)
        if(day.datum < (new Date()).getTime()) {
            let chkBox = $("<input>").attr("type", "checkbox").attr("value", i).
                addClass("hack-chkbox").
                addClass(this.c.isWorkingDay(day) ? "hack-chkbox-workingday" : "hack-chkbox-weekend").
                addClass(this.c.isEmptyDay(day) ? "hack-chkbox-emptyday" : "hack-chkbox-filledday")
            newTd.append(chkBox)
        }
        tdFirst.before(newTd)
    }
    message() {
        // debugLog.apply(null,arguments)
        console.log.apply(console, arguments)
        let msg = ""
        for(let a of arguments) {
            msg += a.toString() + " "
        }
        $("#hack-status-div").html(msg)
    }
    renderStartButton() {
        let self = this
        $(".jelenleti-iv-buttons-row:first").after(
            $("<div>").attr("id", "hack-header").append(
                $("<button>").html("Restart").click(function() {
                    self.render()
                })
            )
        )
    }
}


window.hackStartInterval = setInterval(function() {
        
    if($(".jelenleti-iv-buttons-row:first").length === 0 ) {
        return
    }
    ui = new UI()
    try {
        let nc = new TheNexonHackController()
        let ctrl = nc.ctrl
        let handleJelenletiIvQueryResponse = ctrl.handleJelenletiIvQueryResponse;
        ctrl.handleJelenletiIvQueryResponse = function() {
            handleJelenletiIvQueryResponse.apply(ctrl, arguments)
            ui.render()
        }
    } catch(e) {
        return;
    }
    ui.renderStartButton()
    ui.render()

    window.addEventListener("keydown", function(e){
        function chkToggle(id) {
            let chkbox = $(`#${id}`)
            chkbox.prop("checked", !chkbox.prop("checked"))
            chkbox.change()
        }
        if(e.altKey) {
            switch(e.key) {
                case "r": // (re)start
                    ui.render()
                    break;
                case "t": // set time
                    $("#hack-set-time-btn").click()
                    break;
                case "d": // delete time
                    $("#hack-delete-time-btn").click()
                    break;
                case "1":
                    chkToggle("hack-chkbox-workingday-emptyday-all")
                    break;
                case "2":
                    chkToggle("hack-chkbox-workingday-filledday-all")
                    break;
                case "3":
                    chkToggle("hack-day-all")
                    break;
            }
        }
        debugLog(e)
    })
    clearInterval(window.hackStartInterval)
}, 1000)