const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const scoreSpan = document.getElementById('score')
const accuracySpan = document.getElementById('accuracy')
const streakSpan = document.getElementById('streak')
const multiplierSpan = document.getElementById('multiplier')
const recordSpan = document.getElementById('record')
const timerSpan = document.getElementById('timer')

const gamePaused = document.getElementById('gamePaused')

const modal = document.getElementById('modal')
const modalScore = document.getElementById('modalScore')
const modalRecord = document.getElementById('modalRecord')
const startGameBtn = document.getElementById('startGameBtn')

canvas.width = innerWidth
canvas.height = innerHeight

const x = canvas.width / 2
const y = canvas.height / 2

// Variable declarations
// Declaration only, do not define values here. Go to the startGame function.
const projectiles = []
const enemies = []
const particles = []
let gameStarted = false
let pause = false
let record = localStorage.getItem('record')
if (!record) {
    record = 0
    localStorage.setItem('record', record)
}
let score
let shoots
let shootsHitted
let accuracy
let streak
let multiplier
let minutes
let seconds
let speedAmplifier

modalScore.textContent = record

function startGame() {
    projectiles.length = 0
    enemies.length = 0
    particles.length = 0
    score = 0
    shoots = 0
    shootsHitted = 0
    accuracy = 1
    streak = 0
    multiplier = 1
    minutes = 0
    seconds = 0
    speedAmplifier = 2
    
    pause = false
    gameStarted = true
    modal.style.display = 'none'
    
    record = localStorage.getItem('record')

    printValues()
    
    animate()
    spawnEnemies()
}

function gameOver() {
    const death = new Audio('./death.mp3');
    death.volume = 0.5
    death.pause()
    death.currentTime = 0
    death.play()

    cancelAnimationFrame(animationId)
    clearInterval(spawnInterval)

    if (score > record) {
        localStorage.setItem('record', score)
        record = score
        modalRecord.style.visibility = 'visible'
    }
    
    pause = true
    gameStarted = false
    modalScore.textContent = score
    modal.style.display = 'flex'
}

class Player {
    constructor (x, y, radius, color) {
        this.x = x 
        this.y = y
        this.radius = radius
        this.color = color
    }
    
    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }
}

// Define player stats
const player = new Player(x, y, 15, 'white')

class Projectile {
    constructor (x, y, radius, color, velocity) {
        this.x = x,
        this.y = y,
        this.radius = radius,
        this.color = color,
        this.velocity = velocity
    }
    
    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }
    
    update() {
        this.draw()
        this.x += this.velocity.x
        this.y += this.velocity.y
    }
}

class Enemy {
    constructor (x, y, radius, color, velocity) {
        this.x = x,
        this.y = y,
        this.radius = radius,
        this.color = color,
        this.velocity = velocity
    }
    
    draw() {
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
    }
    
    update() {
        this.draw()
        this.x += this.velocity.x
        this.y += this.velocity.y
    }
}

const friction = 0.99
class Particle {
    constructor (x, y, radius, color, velocity) {
        this.x = x,
        this.y = y,
        this.radius = radius,
        this.color = color,
        this.velocity = velocity
        this.alpha = 1
    }
    
    draw() {
        c.save()
        c.globalAlpha = this.alpha
        c.beginPath()
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false)
        c.fillStyle = this.color
        c.fill()
        c.restore()
    }
    
    update() {
        this.draw()
        this.velocity.x *= friction
        this.velocity.y *= friction
        this.x += this.velocity.x
        this.y += this.velocity.y
        this.alpha -= 0.01
    }
}

let spawnInterval
function spawnEnemies() {
    spawnInterval = setInterval(() => {
        if (!pause && gameStarted){
            let radius = Math.floor(Math.random() * (3 - 1 + 1) + 1)
            switch (radius) {
                case 1:
                    radius = 10
                    break
                case 2:
                    radius = 20
                    break
                case 3:
                    radius = 30
                    break
            }
            let enemy_x
            let enemy_y
            if (Math.random() < 0.5) {
                enemy_x = Math.random() < .5 ? 0 - radius : canvas.width + radius
                enemy_y = Math.random() * canvas.height

            } else {
                enemy_x = Math.random() * canvas.width
                enemy_y = Math.random() < .5 ? 0 - radius : canvas.height + radius
            }

            const color = `hsl(${Math.random() * 360}, 100%, 50%)`
            const angle = Math.atan2(y - enemy_y, x - enemy_x)

            const velocity = {
                x: Math.cos(angle) * speedAmplifier,
                y: Math.sin(angle) * speedAmplifier
            }

            speedAmplifier += (1/60)

            enemies.push(new Enemy(enemy_x, enemy_y, radius, color, velocity))
            
            printValues()
            
            seconds++
            if (seconds == 60) {
                seconds = 0
                minutes++
            }
        }
    }, 1000)
}

let animationId
function animate() {
    
    c.fillStyle = 'rgba(0,0,0, 0.1)'
    if (!pause){
        gamePaused.style.display = 'none'
        animationId = requestAnimationFrame(animate)
        c.fillRect(0, 0, canvas.width, canvas.height)
        player.draw()
        particles.forEach((particle, index) => {
            particle.alpha <= 0 ? particles.splice(index, 1) : particle.update()
        })

        projectiles.forEach((projectile, index) => {
            projectile.update()

            // Remove of edges of screen if missed
            if (
                projectile.x + projectile.radius < 0 ||
                projectile.x - projectile.radius > canvas.width ||
                projectile.y + projectile.radius < 0 ||
                projectile.y - projectile.radius > canvas.height
            ) {
                setTimeout(() => {
                    shoots++
                    projectiles.splice(index, 1)
                    accuracy = shootsHitted <= 0 ? 0 : shootsHitted / shoots
                    streak = 0
                }, 0)
            }
        })

        enemies.forEach((enemy, enemyIndex) => {
            enemy.update()

            const dist = Math.hypot(x - enemy.x, y - enemy.y)

            // End Game
            if (dist <= player.radius + enemy.radius) {
                gameOver()
            }

            projectiles.forEach((projectile, projectileIndex) => {
                const dist = Math.hypot(projectile.x - enemy.x, projectile.y - enemy.y)
                // when projectiles touch enemy
                if (dist <= projectile.radius + enemy.radius) {
                    // Increase streak and shoots hitted
                    streak++
                    shootsHitted++
                    shoots++

                    // Increase score depending on streak
                    if (streak >= 100) {
                        multiplier = 4
                    } else if (streak >= 50) {
                        multiplier = 3
                    } else if (streak >= 25) {
                        multiplier = 2
                    } else {
                        multiplier = 1
                    }

                    score += multiplier

                    accuracy = shootsHitted <= 0 ? 0 : shootsHitted / shoots
                    scoreSpan.textContent = score

                    // Create Explosions
                    for (let i = 0; i < enemy.radius *2; i++) {
                        particles.push(
                            new Particle(
                                projectile.x, // X
                                projectile.y, // Y
                                Math.random() * 3, // Radius
                                enemy.color, // Color
                                {
                                    x: (Math.random() - .5) * (Math.random() * 5), 
                                    y: (Math.random() - .5) * (Math.random() * 5) 
                                } // Velocity
                            )
                        )
                    }

                    enemy.radius -= 10
                    if (enemy.radius == 0) {
                        setTimeout(() => {
                            enemies.splice(enemyIndex, 1)
                        }, 0)
                    }
                    projectiles.splice(projectileIndex, 1)
                    
                }
            });
        })
        
        printValues()
    } else {
        animationId = requestAnimationFrame(animate)
        gamePaused.style.display = 'flex'
    }
}

addEventListener('click', (e) => {
    if (!pause && gameStarted) {
        const angle = Math.atan2(e.clientY - y, e.clientX - x)
        const velocity = {
            x: Math.cos(angle) *5,
            y: Math.sin(angle) *5
        }

        projectiles.push(
            new Projectile(x, y, 5, 'white', velocity)
        )

        const pew = new Audio('./pew.mp3');
        pew.volume = 0.1
        pew.pause()
        pew.currentTime = 0
        pew.play()

    } else if (gameStarted && pause) {
        pause = false
    }
})

addEventListener('keypress', (e) => {
    switch (e.code) {
        case 'KeyP':
        case 'Space':
        case 'Enter':
            pause = !pause
            break
        case 'KeyR':
            gameOver()
            startGame()
            break
        default:
            break
    }
})

addEventListener('contextmenu', (e) => {
    e.preventDefault()
})

onblur = function(){
    pause = true
}

startGameBtn.onclick = function()  {
    startGame()
    pause = true
}

function printValues() {
    scoreSpan.textContent = score
    timerSpan.textContent = `${minutes >= 10 ? minutes : '0'+minutes }:${seconds >= 10 ? seconds : '0'+seconds}`
    accuracySpan.textContent = `${(accuracy*100).toFixed(1)}% (${shootsHitted}/${shoots})`
    streakSpan.textContent = streak
    multiplierSpan.textContent = multiplier
    recordSpan.textContent = record
}