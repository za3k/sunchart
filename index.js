// Enter your location for the calendar here.
// This calendar assumes you're in the northern hemisphere
// Seasons are astronomical spring, summer, fall, and winter (meteorological starts on the first of months instead)
const here = { latitude: 39.1031, longitude: 84.5120 } // Cincinnati, OH, USA

const monthName = { 1: "Jan", 2: "Feb", 3: "Mar", 4: "Apr", 5: "May", 6: "Jun", 7: "Jul", 8: "Aug", 9: "Sep", 10: "Oct", 11: "Nov", 12: "Dec" }
const r = 600
const width=2*r, height=1.2*r, b=0.1*r

function daylightHours(date, place) {
    const times = SunCalc.getTimes(date, place.latitude, place.longitude);
    return (times.sunset - times.sunrise) / (1000 * 60 * 60)
}

function drawGraphInit(canvas) {
    const ctx = canvas.getContext("2d")
    canvas.width  = width  +2*b
    canvas.height = height +2*b

    ctx.translate(b, b)
    return ctx
}

function drawGraphBase(ctx) {
    ctx.save()

    // Draw a semicircle
    ctx.lineWidth = 10
    ctx.strokeStyle = "#000055"
    ctx.beginPath()
    ctx.arc(r, height, r, Math.PI, 2*Math.PI)
    ctx.moveTo(2*r+5, height)
    ctx.lineTo(   -5, height)
    ctx.stroke()
    
    ctx.restore()
}

const center = {x: r, y: height}
function line(a, d) {
    return {
        x: center.x + Math.cos(a)*d,
        y: center.y - Math.sin(a)*d
    }
    
}

function date2angle(date) {
    hours = daylightHours(date, here)
    percentDaylight = hours / 24
    return Math.PI * percentDaylight
}

function drawGraphSegment(ctx, startDate, endDate, label, style) {
    if (startDate instanceof Date) startDate = date2angle(startDate)
    if (endDate instanceof Date) endDate = date2angle(endDate)
    if (startDate > endDate) [startDate, endDate] = [endDate, startDate]

    ctx.save()

    ctx.translate(r, height)
    ctx.rotate(Math.PI + startDate)

    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(r, 0)
    ctx.arc(0, 0, r, 0, endDate-startDate)
    ctx.lineTo(0, 0)
    ctx.lineWidth = 2
    ctx.strokeStyle = style.strokeStyle || "black"
    ctx.fillStyle = style.fillStyle || "blue"
    ctx.setLineDash([20, 20])
    ctx.stroke()
    ctx.fill()

    ctx.rotate((endDate-startDate)/2)
    ctx.font = '14pt Ariel'
    ctx.fillStyle = "grey"
    ctx.lineWidth = 2
    const textSize = ctx.measureText(label)
    ctx.beginPath()
    ctx.fillText(label, r/2, (textSize.actualBoundingBoxAscent-textSize.actualBoundingBoxDescent)/2)

    ctx.restore()
}

function drawGraphTick(ctx, angle, label) {
    ctx.strokeStyle = "black"

    if (angle instanceof Date) angle = date2angle(angle)

    ctx.save()

    ctx.translate(r, height)
    ctx.rotate(Math.PI + angle)

    // Draw the tick
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.moveTo(r-20, 0)
    ctx.lineTo(r+20, 0)
    ctx.stroke()

    // Draw the text (rotated)
    if (label) {
        ctx.lineWidth = 2
        ctx.font = '16pt Arial'
        const textSize = ctx.measureText(label)
        ctx.beginPath()
        ctx.fillText(label, r+40, (textSize.actualBoundingBoxAscent-textSize.actualBoundingBoxDescent)/2)
    }

    ctx.restore()
}

function drawGraphLine(ctx, angle, label, style) {
    if (!style) style={}

    if (angle instanceof Date) angle = date2angle(angle)

    ctx.save()
    ctx.translate(r, height)
    ctx.rotate(Math.PI + angle)

    // Draw the line
    ctx.strokeStyle = style.strokeStyle || "red"
    ctx.lineWidth = 1
    if (style.dashed) ctx.setLineDash([10, 10])

    ctx.beginPath()
    ctx.moveTo(5, 0)
    ctx.lineTo(r + (style.d || 0) + 20*(!!label), 0)
    ctx.stroke()

    // Draw the text (rotated)
    if (label) {
        ctx.setLineDash([])
        ctx.lineWidth = 2
        ctx.font = '10pt Arial'
        ctx.fillStyle = style.fillStyle || ctx.strokeStyle

        ctx.beginPath()
        const textSize = ctx.measureText(label)
        ctx.fillText(label, r + (style.d||0) +40, (textSize.actualBoundingBoxAscent-textSize.actualBoundingBoxDescent)/2)
    }

    ctx.restore()
}

function drawGraphSweep(ctx, angle, clockwise) {
    if (angle instanceof Date) angle = date2angle(angle)
    const arc = 2 / 180 * Math.PI

    ctx.save()
    ctx.translate(r, height)
    ctx.rotate(Math.PI + angle)
    if (clockwise) ctx.scale(1, -1)

    // Draw an arc
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(r, 0)
    ctx.arc(0, 0, r, 0, arc)
    ctx.lineTo(0, 0)

    ctx.lineWidth = 2
    const grad = ctx.createLinearGradient(0, 0, 0, 20)
    grad.addColorStop(0, "rgba(255, 0, 0, 0.4)")
    grad.addColorStop(0.4, "rgba(255, 0, 0, 0.2)")
    grad.addColorStop(0.6, "rgba(255, 0, 0, 0.1)")
    grad.addColorStop(1, "rgba(255, 0, 0, 0)")
    ctx.fillStyle = grad
    ctx.fill()

    ctx.restore()

}

function drawGraph(today) {
    if (!today) today = new Date()
    const thisYear = today.getFullYear()
    const springEquinox  = new Date(thisYear,  3-1, 20) // Start of (astronomical) spring
    const summerSolstice = new Date(thisYear,  6-1, 21) // Start of (astronomical) summer
    const autumnEquinox  = new Date(thisYear,  9-1, 23) // Start of (astronomical) fall
    const winterSolstice = new Date(thisYear, 12-1, 21) // Start of (astronomical) winter

    var g = document.getElementById("graph")
    g.getContext("2d").reset()
    g = drawGraphInit(g)

    // Only show the "direction" of year we're going--towards or away from winter solstice
    const increasingDaylight = (today < summerSolstice) || (today > winterSolstice)

    if (increasingDaylight) {
        drawGraphSegment(g, summerSolstice, autumnEquinox,  "Summer", {fillStyle: 'yellow'})
        drawGraphSegment(g, autumnEquinox,  winterSolstice, "Fall"  , {fillStyle: 'orange'})

        for (var month of [6, 7, 8, 9, 10, 11, 12]) {
            drawGraphTick(g, new Date(thisYear, month, 15), monthName[month])
        }
    } else {
        drawGraphSegment(g, winterSolstice, springEquinox,  "Winter", {fillStyle: 'lightblue'})
        drawGraphSegment(g, springEquinox,  summerSolstice, "Spring", {fillStyle: 'lightgreen'})

        for (var month of [12, 1, 2, 3, 4, 5, 6]) {
            drawGraphTick(g, new Date(thisYear, month, 15), monthName[month])
        }
    }

    drawGraphLine(g, summerSolstice, "summer solstice", {dashed: true, strokeStyle: "grey", d: 50})
    drawGraphLine(g, winterSolstice, "winter solstice", {dashed: true, strokeStyle: "grey", d: 50})

    for (var hour = 0; hour <= 12; hour++) {
        drawGraphLine(g, hour/12*Math.PI, undefined, {dashed: true, strokeStyle: "lightgrey"})
    }

    drawGraphLine(g, today, "you are here", {strokeStyle: "red", d: 50})
    drawGraphSweep(g, today, increasingDaylight) // Draw motion sweep to indicate direction
    drawGraphBase(g)
}

function main() { drawGraph(new Date()) }

function demo() {
    var today = new Date()
    function advanceOneDay() {
        today.setDate(today.getDate()+1)
        console.log(today)
        drawGraph(today)
    }
    setInterval(advanceOneDay, 50)
}

document.addEventListener('DOMContentLoaded', main)

