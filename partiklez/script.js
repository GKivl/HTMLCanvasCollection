const customization = {
    'posArrLen': 3,
    'maxLifeLen': 100,
    'rad': 3,
    'veloDiv': 10,
    'rotationDiv': 1,
    'hue': Number(getComputedStyle(document.body).getPropertyValue('--hue'))
}; for(let key in customization) document.getElementById(key).value = customization[key]

function update() {
    for(let key in customization)
        customization[key] = Number(document.getElementById(key).value)
    document.body.style.setProperty('--hue', customization.hue) // Adjusts document's --hue variable which is responsible for border colors
}

const canvas = document.getElementById('kanvas')

let CWidth, CHeight, rect
function onResize() {
    let parentStyle = getComputedStyle(canvas.parentElement)

    let bodyWidth = parentStyle.width.slice(0, -2) - parentStyle.paddingLeft.slice(0, -2) - parentStyle.paddingRight.slice(0, -2)
    
    let aspectRatio = 2 / 3

    canvas.setAttribute('width', bodyWidth)
    canvas.setAttribute('height', bodyWidth * aspectRatio)

    CWidth = bodyWidth
    CHeight = bodyWidth * aspectRatio

    rect = canvas.getBoundingClientRect()
} onResize(); addEventListener('resize', onResize); addEventListener('scroll', onResize)

let x, y
addEventListener(
    'mousemove',
    (event) => {
        x = event.clientX - rect.left
        y = event.clientY - rect.top
    }
);

function anim(x) {
    return -Math.pow(x, 5) + 1
}

/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext('2d')

let particles = []

function progresParticles() {
    let newParticles = []
    particles.forEach((particle) => {
        if(particle.lifeLen < customization.maxLifeLen) {
            particle.x += particle.velocity[0] / customization.veloDiv * (1 + particle.lifeLen / customization.maxLifeLen)
            particle.y += particle.velocity[1] / customization.veloDiv * (1 + particle.lifeLen / customization.maxLifeLen)        

            let cosTheta = Math.cos(particle.angle / customization.rotationDiv)
            let sinTheta = Math.sin(particle.angle / customization.rotationDiv)

            let xNew = particle.velocity[0] * cosTheta - particle.velocity[1] * sinTheta;
            let yNew = particle.velocity[0] * sinTheta + particle.velocity[1] * cosTheta;
            
            particle.velocity[0] = xNew
            particle.velocity[1] = yNew

            particle.lifeLen++

            newParticles.push(particle)
        }
    })

    particles = newParticles
}

let prevPosArr = [[0, 0]]
function addParticle(x, y) {
    if(prevPosArr.length >= customization.posArrLen)
        prevPosArr = prevPosArr.slice(prevPosArr.length - customization.posArrLen + 1)
    
    prevPosArr.push([x, y])
    
    
    if(prevPosArr.length >= customization.posArrLen) {
        // End to end
        let velocityEtE = [x - prevPosArr[0][0], y - prevPosArr[0][1]]
        
        /*  A
         *  |\
         *  | \
         *  |  \
         *  |   \
         *  | B  \
         *  +––––– C
         */

        // Point A
        let prevPosMidX = prevPosArr[Math.round(prevPosArr.length / 2) - 1][0]
        let prevPosMidY = prevPosArr[Math.round(prevPosArr.length / 2) - 1][1]

        // Point B
        let prevPosLastXRelToMid = prevPosArr[prevPosArr.length - 1][0] - prevPosMidX
        let prevPosLastYRelToMid = prevPosArr[prevPosArr.length - 1][1] - prevPosMidY
        
        // Point C
        let prevPosOldestXRelToMid = prevPosArr[0][0] - prevPosMidX
        let prevPosOldestYRelToMid = prevPosArr[0][1] - prevPosMidY
        
        let ab = Math.sqrt(Math.pow(prevPosLastXRelToMid, 2) + Math.pow(prevPosLastYRelToMid, 2))
        let bc = Math.sqrt(Math.pow(prevPosOldestXRelToMid, 2) + Math.pow(prevPosOldestYRelToMid, 2))
        let ac = Math.sqrt(Math.pow(prevPosLastXRelToMid + prevPosOldestXRelToMid, 2) + Math.pow(prevPosLastYRelToMid + prevPosOldestYRelToMid, 2))

        let angle = Math.acos((ab*ab + bc*bc - ac*ac) / (2*ab*bc))

        particles.push({
            x: x,
            y: y,
            angle: angle,
            velocity: velocityEtE,
            lifeLen: 0
        })
    }
}

function draw() {
    ctx.clearRect(0, 0, CWidth, CHeight)

    particles.forEach((particle) => {
        ctx.fillStyle = `hsla(
            ${customization.hue + particle.lifeLen / customization.maxLifeLen * 270},
            100%,
            ${60 + Math.abs(anim(particle.lifeLen / customization.maxLifeLen) - 1) / 0.05}%,
            ${anim(particle.lifeLen / customization.maxLifeLen)}
        )`

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, customization.rad * anim(particle.lifeLen / customization.maxLifeLen), 0, Math.PI*2)
        ctx.fill()
    })
}

function reset() {
    particles = []
    prevPosArr = [[0, 0]]
}


setInterval(() => {
    progresParticles()
    
    let lastX = prevPosArr[prevPosArr.length - 1][0]
    let lastY = prevPosArr[prevPosArr.length - 1][1]

    if(x >= 0 && x <= CWidth && y >= 0 && y <= CHeight && lastX != x && lastY != y)
        addParticle(x, y)

    draw()
}, 10)