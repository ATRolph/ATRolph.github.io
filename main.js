const gameEngine = new GameEngine();
var canvasWidth;
var canvasHeight;

function centerDistance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function futureDistance(a, b) {
    var dx = a.x - (b.x + b.velocity.x * gameEngine.clockTick);
    var dy = a.y - (b.y + b.velocity.y * gameEngine.clockTick);
    return Math.sqrt(dx * dx + dy * dy) - a.radius - b.radius;
}

function edgeDistance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy) - a.radius - b.radius;
}

function Circle(x, y, area, color) {
    this.colors = ["Red", "Green"];
    if (color <= 1) {
        this.color = color;
    } else {
        this.color = Math.floor(Math.random() * 50 / 48.5);
    }
    if (this.color === 1) {
        this.radius = 15;
    } else {
        this.radius = Math.random() * 10 + 5;
    }
    this.area = area || Math.PI * Math.pow(this.radius, 2);
    this.radius = Math.sqrt(this.area / Math.PI);
    this.closestPredator = null;
    this.closestPrey = null;
    this.closestFood = null;
    this.closestPredatorDistance = Infinity;
    this.closestPreyDistance = Infinity;
    this.closestFoodDistance = Infinity;
    this.velocity = {x: 0, y: 0};
    this.speed = 100;
    this.x = x || Math.random() * (canvasWidth - this.radius);
    this.y = y || Math.random() * (canvasHeight - this.radius); 
    Entity.call(this, gameEngine, this.x, this.y);
};

Circle.prototype = new Entity();
Circle.prototype.constructor = Circle;

Circle.prototype.eat = function (other) {
    return centerDistance(this, other) < this.radius - other.radius;
};

Circle.prototype.collideLeft = function () {
    return this.x < 0;
};

Circle.prototype.collideRight = function () {
    return this.x > canvasWidth;
};

Circle.prototype.collideTop = function () {
    return this.y < 0;
};

Circle.prototype.collideBottom = function () {
    return this.y > canvasHeight;
};

Circle.prototype.update = function () {
    Entity.prototype.update.call(this);
    let temp = this.speed;
    // this.speed = document.getElementById('speed').value;
    this.velocity.x = (this.velocity.x / temp) * this.speed;
    this.velocity.y = (this.velocity.y / temp) * this.speed;
    this.x += this.velocity.x * gameEngine.clockTick;
    this.y += this.velocity.y * gameEngine.clockTick;
    this.closestPredator = null;
    this.closestPrey = null;
    this.closestFood = null;
    this.closestPreyDistance = Infinity;
    this.closestPredatorDistance = Infinity;
    this.closestFoodDistance = Infinity;
    this.max = 100000;
    if (this.collideLeft()) this.x = 0;
    if (this.collideRight()) this.x = canvasWidth;
    if (this.collideTop()) this.y = 0;
    if (this.collideBottom()) this.y = canvasHeight;
    for (var i = 0; i < gameEngine.entities.length; i++) {
        let ent = gameEngine.entities[i];
        if (this != ent && this.eat(ent)) {
            if (ent.color === 1 && ent instanceof Circle) {
                this.removeFromWorld = true;
                ent.removeFromWorld = true;
            } else if (this.area > ent.area) {
                if (ent.color === 1 && ent instanceof Food && this.area != this.max) {
                    this.area *= 5;
                } else if (this.area != this.max) {
                    if (this.area + ent.area > this.max) {
                        this.area = this.max;
                    } else {
                        this.area += ent.area;
                    }
                }
                this.radius = Math.sqrt(this.area / Math.PI);
                ent.removeFromWorld = true;
            }
        }
        if (ent instanceof Food) {
            if (ent.color === 1 && edgeDistance(this, ent) <= 200) {
                if (this.closestFood) {
                    if (this.closestFood.color === 1) {
                        if (edgeDistance(this, ent) < this.closestFoodDistance) {
                            this.closestFood = ent;
                            this.closestFoodDistance = edgeDistance(this, ent)
                        }
                    } else {
                        this.closestFood = ent;
                        this.closestFoodDistance = edgeDistance(this, ent);
                    }
                } else {
                    this.closestFood = ent;
                    this.closestFoodDistance = edgeDistance(this, ent);
                }
            } else {
                if (edgeDistance(this, ent) < this.closestFoodDistance) {
                    if (this.closestFood) {
                        if (this.closestFood.color != 1) {
                            this.closestFood = ent;
                            this.closestFoodDistance = edgeDistance(this, ent);
                        }
                    } else {
                        this.closestFood = ent;
                        this.closestFoodDistance = edgeDistance(this, ent);
                    }
                }
            }
        }
        if (this.area - ent.area > 0 && ent instanceof Circle && this != ent) {
            if (edgeDistance(this, ent) < this.closestPreyDistance) {
                this.closestPrey = ent;
                this.closestPreyDistance = edgeDistance(this, ent);
            } else if (edgeDistance(this, ent) === this.closestPreyDistance) {
                if (this.closestPrey.area < ent.area) {
                    this.closestPrey = ent;
                    this.closestPreyDistance = edgeDistance(this, ent);
                }
            }
        }
        if (ent.area - this.area > 0 && ent instanceof Circle && this != ent) {
            if (edgeDistance(this, ent) < this.closestPredatorDistance) {
                this.closestPredator = ent;
                this.closestPredatorDistance = edgeDistance(this, ent);
            }
        }
        if (this.closestPredator && this.closestPrey && this.closestFood) {
            let newXDir = 0;
            let newYDir = 0;
            if (this.closestFood.color === 1 && this.area != this.max) {
                newXDir = this.closestFood.x - this.x;
                newYDir = this.closestFood.y - this.y;
            } else if (this.closestPredatorDistance <= this.closestPreyDistance) {
                newXDir = this.x - this.closestPredator.x;
                newYDir = this.y - this.closestPredator.y;
            } else if (this.closestPreyDistance <= this.closestFoodDistance || this.area > 2000) {
                newXDir = this.closestPrey.x - this.x;
                newYDir = this.closestPrey.y - this.y;
            } else {
                newXDir = this.closestFood.x - this.x;
                newYDir = this.closestFood.y - this.y;
            }
            let newMagnitude = Math.sqrt(newXDir * newXDir + newYDir * newYDir);
            this.velocity.x = this.speed * (newXDir / newMagnitude);
            this.velocity.y = this.speed * (newYDir / newMagnitude);          
        } else if (this.closestPrey && this.closestFood) {
            let newXDir = 0;
            let newYDir = 0;
            if (this.closestFood.color === 1 && this.area != this.max) {
                newXDir = this.closestFood.x - this.x;
                newYDir = this.closestFood.y - this.y;
            } else if (this.closestPreyDistance <= this.closestFoodDistance || this.area > 2000) {
                newXDir = this.closestPrey.x - this.x;
                newYDir = this.closestPrey.y - this.y;
            } else {
                newXDir = this.closestFood.x - this.x;
                newYDir = this.closestFood.y - this.y;
            }
            let newMagnitude = Math.sqrt(newXDir * newXDir + newYDir * newYDir);
            this.velocity.x = this.speed * (newXDir / newMagnitude);
            this.velocity.y = this.speed * (newYDir / newMagnitude);         
        }
    }
}
Circle.prototype.draw = function (ctx) {
    ctx.fillStyle = "White";
    ctx.textAlign = "center";
    if (this.color === 1) {
        ctx.fillText("Infected", this.x, this.y - this.radius);
        ctx.fillStyle = this.colors[this.color];
    } else if (this.area === this.max) {
        ctx.fillText("Size: Max", this.x, this.y - this.radius);
        ctx.fillStyle = "Red";
    } else {
        ctx.fillText("Size: " + Math.round(this.area), this.x, this.y - this.radius);
        ctx.fillStyle = "rgb(" + this.radius * 3 + " , 0, 100)";
    }
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
};

////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////

function Food(x, y, area, color) {
    this.colors = ["Cyan", "Yellow"];
    if (color <= 1) {
        this.color = color;
    } else {
        this.color = color || Math.floor(Math.random() * 100 / 99)
    }
    if (this.color === 1) {
        this.radius = 4;
    } else {
        this.radius = Math.floor(Math.random() * 3 + 1);
    }
    this.area = area || Math.PI * Math.pow(this.radius, 2);
    this.radius = Math.sqrt(this.area / Math.PI);
    this.speed = 0;
    this.x = x || Math.random() * (canvasWidth - this.radius);
    this.y = y || Math.random() * (canvasHeight - this.radius);
    Entity.call(this, gameEngine, this.x, this.y);
};

Food.prototype = new Entity();
Food.prototype.constructor = Food;

Food.prototype.update = function () {
    Entity.prototype.update.call(this);
    let circleCount = 0;
    let foodCount = 0;
    for (let i = 0; i < gameEngine.entities.length; i++) {
        if (gameEngine.entities[i] instanceof Circle) {
            circleCount++;
        } else if (gameEngine.entities[i] instanceof Food) {
            foodCount++;
        }
    }
    while (circleCount < 100) {
        let circle = new Circle();
        gameEngine.addEntity(circle);
        circleCount++;
    }
    while (foodCount < 500) {
        let food = new Food();
        gameEngine.addEntity(food);
        foodCount++;
    }
};

Food.prototype.draw = function (ctx) {
    ctx.textAlign = "center";
    ctx.fillStyle = "White";
    if (this.color === 1) {
        ctx.fillText("Super Food", this.x, this.y);
    }
    ctx.beginPath();
    ctx.fillStyle = this.colors[this.color];
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();
};

////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////

var ASSET_MANAGER = new AssetManager();

var socket = io.connect("http://24.16.255.56:8888");

window.onload = function () {
    
    socket.on("connect", function () {
        console.log("Socket connected.")
    });

    socket.on("disconnect", function () {
        console.log("Socket disconnected.")
    });

    socket.on("reconnect", function () {
        console.log("Socket reconnected.")
    });

    let saveButton = document.getElementById("save");
    saveButton.onclick = function() {
        console.log("Saving state...");
        let xPositions = [];
        let yPositions = [];
        let sizes = [];
        let colors = [];
        let speeds = [];
        for (let i = 0; i < gameEngine.entities.length; i++) {
            xPositions.push(gameEngine.entities[i].x);
            yPositions.push(gameEngine.entities[i].y);
            sizes.push(gameEngine.entities[i].area);
            colors.push(gameEngine.entities[i].color)
            speeds.push(gameEngine.entities[i].speed);
        }
        let attributes = [xPositions, yPositions, sizes, colors, speeds];
        socket.emit("save", {studentname:"Andrew Rolph", statename:"userSave", 
        data:attributes});
        console.log("Saved!");
        document.getElementById("gameWorld").focus();
    }

    let loadButton = document.getElementById("load");
    loadButton.onclick = function() {
        console.log("Loading state...");
        socket.emit("load", {studentname:"Andrew Rolph", statename:"userSave"});
        document.getElementById("gameWorld").focus();
    }

    socket.on("load", function (data) {
        for (let i = 0; i < gameEngine.entities.length; i++) {
            gameEngine.entities[i].removeFromWorld = true;
        }
        for (let i = 0; i < data.data[4].length; i++) {
            var ent;
            if (data.data[4][i] === 0) {
                gameEngine.addEntity(new Food(data.data[0][i], data.data[1][i], data.data[2][i], data.data[3][i]));               
            } else {
                gameEngine.addEntity(new Circle(data.data[0][i], data.data[1][i], data.data[2][i], data.data[3][i]));            
            }           
        }    
        console.log("Loaded!");
    });
}
ASSET_MANAGER.queueDownload("./img/960px-Blank_Go_board.png");
ASSET_MANAGER.downloadAll(function () {
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');
    canvasWidth = canvas.width;
    canvasHeight = canvas.height;
    for (var i = 0; i < 100; i++) {
        var circle = new Circle();
        gameEngine.addEntity(circle);
    }
    for (var i = 0; i < 500; i++) {
        var food = new Food();
        gameEngine.addEntity(food);
    }
    gameEngine.init(ctx);
    gameEngine.start();
});
