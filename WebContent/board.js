var WHITE=0;
var BLACK=1;
var VERTICAL=0;
var HORIZONTAL=1;
var PAWN=0;
var WALL=1;

var state = undefined;
var serverGateListener = undefined;

$(document).ready(function () {
    //initializeBoard();
    var board = new Board("#board");
    board.drawGeneralStaticBoard();
	state=new CanvasState(document.getElementById('board'));
	state.setBoard(board);
	for (var i=0; i < 10; i++) {
	state.addShape(new Wall( WHITE, i));
	}
	for (var i=0; i < 10; i++) {
		state.addShape(new Wall(BLACK, i));
	}
    state.addShape(new Pawn(WHITE, 4, 0));
    state.addShape(new Pawn(BLACK, 4, 8));
    state.addServerGate(new ServerGate());
    serverGateListener=new ServerGateListener(state);
    // TESTY
    //setTimeout(function(){serverGateListener.setEnabled(true);});
    setTimeout(function(){serverGateListener.setCurrentPlayer(WHITE);});
    setTimeout(function(){serverGateListener.setActivePlayer(WHITE);}, 5000);
    setTimeout(function(){serverGateListener.setActivePlayer(BLACK);}, 10000);
    setTimeout(function(){serverGateListener.setActivePlayer(WHITE);}, 15000);
    setTimeout(function(){serverGateListener.onGameEnded(WHITE);}, 16000);
    /* setTimeout(function(){serverGateListener.onPlayerMovedPawn(WHITE, {col: 4, row: 2})},3000);
     * setTimeout(function(){serverGateListener.onPlayerBuiltWall(WHITE, {col: 1, row: 1, layout: VERTICAL})},6000);
     * setTimeout(function(){serverGateListener.onPlayerBuiltWall(WHITE, {col: 6, row: 6, layout: HORIZONTAL})},9000);
    */
    /*
     * TEST METODY ODŚWIEŻAJĄCEJ CAŁY STAN GRY
     */
    var p1 = {
    	type: 0,
    	player: 0,
    	targetPosition: {
    		col: 4,
    		row: 1,
    		layout: undefined
    	}
    };
    
    var w1 = {
    	type: 1,
        player: 0,
        targetPosition: {
        	col: 1,
        	row: 3,
        	layout: 0
        }	
    };
    
    var w2 = {
    	type: 1,
        player: 1,
        targetPosition: {
            col: 5,
            row: 7,
            layout: 1
        }	    		
    };
    
    var elements=[];
    elements.push(p1);
    elements.push(w1);
    elements.push(w2);
    setTimeout(function(){serverGateListener.refreshGameState(elements);},3000);
    setTimeout(function(){serverGateListener.setWallCount(WHITE, 9);},4000);
    setTimeout(function(){serverGateListener.setWallCount(BLACK, 9);},6000);
    
});

	var SETTINGS = {
	        board: {
	            width: undefined,
	            height: undefined,
	            offset: {
	                x: 50,
	                y: 50
	            },
	            offsetFromBoardEdgeToFieldsSpace: 40,
	            fields: {
	                rows: 9,
	                cols: 9,
	                size: {
	                    width: 50,
	                    height: 50
	                },
	                color: "#ff9933",
	                backgroundColor: "#ff9933",
	                outline: {
	                    width: 2,
	                    color: "#993300"
	                }
	            }
	        },
	        background: {
	            color1: "#F0FFF0",//"#E0EEE0"
	            color2: "#C1CDC1"
	        },
	        outline: {
	            color: "#8B4513",
	            width: 5
	        },
	        wall: {
	        	offset: {
	        		x: 55,
	        		y: 10	
	        	},
	        	gap: 20,
	        	size : {
	        		width: 10,
	        		height: 100
	        	}
	        }
	    };

function CanvasState(canvas) {
	this.canvas=canvas;
	this.width=canvas.width;
	this.height=canvas.height;
	this.ctx=canvas.getContext('2d');
	
	var stylePaddingLeft, stylePaddingTop, styleBorderLeft, styleBorderTop;
	if(document.defaultView && document.defaultView.getComputedStyle) {
		this.stylePaddingLeft=parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingLeft'], 10) || 0;
		this.stylePaddingTop=parseInt(document.defaultView.getComputedStyle(canvas, null)['paddingTop'], 10) || 0;
		this.styleBorderLeft=parseInt(document.defaultView.getComputedStyle(canvas, null)['borderLeftWidth'], 10) || 0;
		this.styleBorderTop=parseInt(document.defaultView.getComputedStyle(canvas, null)['borderTopWidth'], 10) || 0;
	}
	var html=document.body.parentNode;
	this.htmlTop=html.offsetTop;
	this.htmlLeft=html.offsetLeft;
	
	this.valid=false;
	this.shapes=[];
	this.dragging=false;
	this.selection=null;
	this.dragoffx=0;
	this.dragoffy=0;
	
	this.img=new Image();
	this.img.src="images/its_your_turn.gif";
	this.img_visible=false;

	var _serverGate=null;
	var _enabled=false;
	
	var _board=undefined;
	
	var _currentPlayer=undefined;
	
	var myState=this;
	canvas.addEventListener('mousedown', function(e) {
		if(e.which==1) {
			if(!_enabled)
				return;
			var mouse=myState.getMouse(e);
			var mx=mouse.x;
			var my=mouse.y;
			var shapes=myState.shapes;
			var l=shapes.length;
			for (var i=l-1; i>=0; i--) {
				if (shapes[i].contains(mx,my)) {
					var mySel=shapes[i];
					if(mySel.getType()==PAWN && mySel.getPawnColor()!=myState.getCurrentPlayer())
						return;
					if(mySel.getType()==WALL && mySel.getPlayerColor()!=myState.getCurrentPlayer())
						return;
					if (mySel.getType()==WALL && mySel.isUsed()) {
						console.log("jestem w użyciu");
						return;
					}
					if(myState.selection==mySel || myState.selection==null) {
						var mySelCoord=mySel.getCoordinates();
						myState.dragoffx=mx-mySelCoord.x;
						myState.dragoffy=my-mySelCoord.y;
						myState.dragging=true;
						myState.selection=mySel;
						myState.valid=false;
						return;
					}
				}
			}
			if(myState.selection) {
				
				if(myState.selection.getType()==PAWN) {
					myState.getServerGate().onPlayerMovedPawn(myState.selection.getPawnColor(),
							myState.selection.getPawnTempPosition());
					myState.selection.setPawnPosition(myState.selection.getPawnTempPosition().col, myState.selection.getPawnTempPosition().row);
					//myState.getServerGate().refreshGameState(myState.shapes);
				}
				else if(myState.selection.getType()==WALL 
						&& myState.selection.getWallPosition().col < SETTINGS.board.fields.cols+1) {
					myState.getServerGate().onPlayerBuiltWall(myState.selection.getPlayerColor(),
							myState.selection.getWallPosition());
					myState.selection.setUsed(true);
					//myState.getServerGate().refreshGameState(myState.shapes);
				}
				myState.selection=null;
				myState.valid=false;
			}
		}
		else if(e.which==2) {
			if(!_enabled)
				return;
			var mouse=myState.getMouse(e);
			var mx=mouse.x;
			var my=mouse.y;
			if(mx>SETTINGS.board.width)
				return;
			var shapes=myState.shapes;
			var l=shapes.length;
			for (var i=l-1; i>=0; i--) {
				if (shapes[i].contains(mx,my)) {
					var mySel=shapes[i];
					var mySelCoord=mySel.getCoordinates();
					if(mySel.getType()==WALL && !(mySel.isUsed())) {
						var col=(mySelCoord.x-SETTINGS.wall.size.width/2-SETTINGS.board.offset.y - 
							SETTINGS.board.offsetFromBoardEdgeToFieldsSpace)/SETTINGS.board.fields.size.height;
						var row=(mySelCoord.y+SETTINGS.wall.size.height/2-SETTINGS.board.offset.x - 
								SETTINGS.board.offsetFromBoardEdgeToFieldsSpace)/SETTINGS.board.fields.size.width;
						var x=SETTINGS.board.offset.y + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + Math.round(col) * SETTINGS.board.fields.size.height;
						var y=SETTINGS.board.offset.x + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + Math.round(row) * SETTINGS.board.fields.size.width;
						if(mySel.getLayout()==VERTICAL) {
							mySel.setLayout(HORIZONTAL);
							if(!mySel.validMove(Math.round(col), Math.round(row)-1, HORIZONTAL, shapes)) {
								mySel.setLayout(VERTICAL);
								return;
							}
							y=y-SETTINGS.wall.size.width/2;
							y=y-SETTINGS.board.fields.size.height;
							mySel.setSize(SETTINGS.wall.size.height,SETTINGS.wall.size.width);
							mySel.setLayout(HORIZONTAL);
						}
						else if(mySel.getLayout()==HORIZONTAL) {
							mySel.setLayout(VERTICAL);
							if(!mySel.validMove(Math.round(col), Math.round(row)-1, VERTICAL, shapes)) {
								mySel.setLayout(HORIZONTAL);
								return;
							}
							x=x-SETTINGS.wall.size.width/2;
							y=y-SETTINGS.board.fields.size.height;
							mySel.setSize(SETTINGS.wall.size.width, SETTINGS.wall.size.height);
							mySel.setLayout(VERTICAL);
						}
						mySel.setCoordinates(x,y);
						myState.selection=mySel;
						myState.valid=false;
					}
					return;
				}
			}
		}
	}, true);
	canvas.addEventListener('mousemove', function(e){
		if(!_enabled)
			return;
		if(myState.dragging) {
			var mouse=myState.getMouse(e);
			myState.selection.setCoordinates(mouse.x-myState.dragoffx, mouse.y-myState.dragoffy);
			myState.valid=false;
		}
	}, true);
	canvas.addEventListener('mouseup', function(e){
		if (e.which==1) {
			if(!_enabled)
				return;
			if(myState.dragging) {
				var coord=myState.selection.getCoordinates();
				var col=(coord.x-SETTINGS.board.offset.y - 
						SETTINGS.board.offsetFromBoardEdgeToFieldsSpace)/SETTINGS.board.fields.size.height;
				var row=(coord.y-SETTINGS.board.offset.x - 
						SETTINGS.board.offsetFromBoardEdgeToFieldsSpace)/SETTINGS.board.fields.size.width;
				var x=SETTINGS.board.offset.y + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + Math.round(col) * SETTINGS.board.fields.size.height;
				var y=SETTINGS.board.offset.x + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + Math.round(row) * SETTINGS.board.fields.size.width;
				if(myState.selection.getType()==PAWN) {
					if(myState.selection.validMove(Math.round(col),Math.round(row),myState.shapes))
						myState.selection.setPawnTempPosition(Math.round(col),Math.round(row));
					else {
						originalPos=myState.selection.getPawnTempPosition();
						var x=SETTINGS.board.offset.y + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + Math.round(originalPos.col) * SETTINGS.board.fields.size.height;
						var y=SETTINGS.board.offset.x + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + Math.round(originalPos.row) * SETTINGS.board.fields.size.width;
					}
				}
				if(myState.selection.getType()==WALL){
					if(myState.selection.validMove(Math.round(col),Math.round(row),
							myState.selection.getLayout(), myState.shapes)) {
						if(myState.selection.getLayout()==VERTICAL) {
							x=x-SETTINGS.wall.size.width/2;
							//poczatek testu
							/*myState.selection.setCoordinates(x, y);
							var counter1=myState.shapes.length;
							for (var i=counter1-1; i>=0; i--) {
								if (myState.shapes[i].getType()==PAWN) {
									var availableMove=[];
									availableMove=myState.getBoard().getField(myState.shapes[i].getPawnPosition().col,myState.shapes[i].getPawnPosition().row).availableMove(myState.shapes);
									var counter2=availableMove.length;
									//console.log("Pawn - col: "+myState.shapes[i].getPawnPosition().col+", row: "+myState.shapes[i].getPawnPosition().row);
									//console.log("Avails");
									for(var ii=0; ii<counter2; ii++) {
										//console.log("col: "+availableMove[ii].col+", row: "+availableMove[ii].row);
									}
								}					
							}*/
							//koniec testu
						}
						else if(myState.selection.getLayout()==HORIZONTAL) {
							y=y-SETTINGS.wall.size.width/2;
							//poczatek testu
							/*myState.selection.setCoordinates(x, y);
							var counter1=myState.shapes.length;
							for (var i=counter1-1; i>=0; i--) {
								if (myState.shapes[i].getType()==PAWN) {
									var availableMove=[];
									availableMove=myState.getBoard().getField(myState.shapes[i].getPawnPosition().col,myState.shapes[i].getPawnPosition().row).availableMove(myState.shapes);
									var counter2=availableMove.length;
									//console.log("Pawn - col: "+myState.shapes[i].getPawnPosition().col+", row: "+myState.shapes[i].getPawnPosition().row);
									//console.log("Avails");
									for(var ii=0; ii<counter2; ii++) {
									//	console.log("col: "+availableMove[ii].col+", row: "+availableMove[ii].row);
									}
								}					
							}*/
							//koniec testu
						}	
					}
					else {
						x=myState.selection.getDefaultWallPosition().x;
						y=myState.selection.getDefaultWallPosition().y;
						w=myState.selection.getDefaultWallPosition().w;
						h=myState.selection.getDefaultWallPosition().h;
						myState.selection.setLayout(VERTICAL);
						myState.selection.setSize(w,h);
					} 
				}
				myState.selection.setCoordinates(x, y);
				myState.valid=false;
				myState.dragging=false;
			}
		}
	}, true);
		
	this.selectionColor='#00EE00';
	this.selectionWidth=4;
	this.interval=30;
	setInterval(function() {
		myState.draw();
	}, myState.interval);
	
	this.addServerGate=function(serverGate) {
		console.log(serverGate);
		_serverGate=serverGate;
	};
	
	this.getServerGate=function() {
		return _serverGate;
	};
	
	this.setEnabled=function(enabled) {
		_enabled=enabled;
	};
	
	this.setBoard=function(board) {
		_board=board;
	};
	
	this.getBoard=function() {
		return _board;
	};
	
	this.setCurrentPlayer=function(player)
	{
		_currentPlayer=player;
	};
	
	this.getCurrentPlayer=function(player) {
		return _currentPlayer;
	};
};


CanvasState.prototype.addShape=function(shape) {
	this.shapes.push(shape);
	this.valid=false;
};

CanvasState.prototype.clear=function() {
	this.ctx.clearRect(0,0,this.width,this.height);
};

CanvasState.prototype.draw=function() {
	if(!this.valid) {
		var ctx=this.ctx;
		var shapes=this.shapes;
		this.clear();
		drawBoard(this.getBoard());
		var l=shapes.length;
		for(var i=0; i<l; i++) {
			var shape=shapes[i];
			var shapeCoord=shape.getCoordinates();
			var shapeSize=shape.getSize();
			if (shapeCoord.x>this.width 
					|| shapeCoord.y>this.height
					|| shapeCoord.x+shapeSize.w<0
					|| shapeCoord.y+shapeSize.h<0)
				continue;
			shapes[i].draw(ctx);
		}
		if(this.img_visible)
			this.ctx.drawImage(this.img, 600,225,155,135);
		if(this.selection!=null) {
			ctx.strokeStyle=this.selectionColor;
			ctx.strokeWidth=this.selectionWidth;
			var mySel=this.selection;
			var mySelCoord=mySel.getCoordinates();
			var mySelSize=mySel.getSize();
			ctx.strokeRect(mySelCoord.x,mySelCoord.y,mySelSize.w,mySelSize.h);
		}
		this.valid=true;
	}
};

CanvasState.prototype.getMouse=function(e) {
	var element=this.canvas, offsetX=0, offsetY=0, mx, my;
	if (element.offsetParent!==undefined) {
		do {
			offsetX+=element.offsetLeft;
			offsetY+=element.offsetTop;
		} while ((element=element.offsetParent));
	}
	
	offsetX+=this.stylePaddingLeft+this.styleBorderLeft+this.htmlLeft;
	offsetY+=this.stylePaddingTop+this.styleBorderTop+this.htmlTop;
	
	mx=e.pageX-offsetX;
	my=e.pageY-offsetY;
	
	return {x: mx, y: my };
};


	
	
function Pawn(player, col, row) {
	
	var _type=PAWN;
	
	var _col=col;
	var _row=row;
	
	var _tempCol=_col;
	var _tempRow=_row;
	
	var _w = SETTINGS.board.fields.size.width;
    var _h = SETTINGS.board.fields.size.height;
	var _x=SETTINGS.board.offset.y + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + col * _h;
	var _y=SETTINGS.board.offset.x + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + row * _w;
	
	var _player=player;
	
    var _img=new Image();
    if(_player==WHITE) 
		_img.src="images/wPawn.png";
	else if(_player==BLACK)
		_img.src="images/bPawn.png";
    
    this.draw=function(ctx) {
    	
    	ctx.drawImage(_img, _x, _y, _w, _h);
	};

	this.contains=function(mx, my) {
		return (_x <= mx) && (_x+_w >=mx) &&
		(_y <= my) && (_y+_h>=my);
	};
	
	this.getCoordinates=function() {
		return {x: _x, y: _y};
	};
	
	this.setCoordinates=function(x, y) {
		_x=x;
		_y=y;
	};
	
	this.getSize=function() {
		return {w: _w, h: _h};
	};
	
	this.setSize=function(w, h) {
		_w=w;
		_h=h;
	};
	
	this.setPawnPosition=function(col,row) {
		_col=col;
		_row=row;
		_tempCol=col;
		_tempRow=row;
	};
	
	this.getPawnPosition=function() {
		return {col: _col, row: _row};
	};
	
	this.setPawnTempPosition=function(col, row) {
		_tempCol=col;
		_tempRow=row;
	};

	this.getPawnTempPosition=function() {
		return {col: _tempCol, row: _tempRow};
		
	};
	
	this.getPawnColor=function() {
		return _player;
	};
	
	this.getType=function() {
		return _type;
	};
	
	this.validMove=function(newCol, newRow, shapes) {
		if(newCol < 0 || newCol > SETTINGS.board.fields.cols - 1 
				|| newRow < 0 || newRow > SETTINGS.board.fields.rows - 1)
			return false;
		if(Math.abs(newCol-_col)==0) {
			if (newRow-_row==-1) {
				var l=shapes.length;
				for(var i=l-1; i>=0; i--) {
					var shape=shapes[i];
					if(shape.getType()==WALL) {
						var shapePos=shape.getWallPosition();
						var shapeLayout=shape.getLayout();
						if(shapeLayout==HORIZONTAL && shapePos.row==newRow+1 
								&& ((newCol-shapePos.col)==1 || (newCol-shapePos.col)==0))
							return false;
					}
				}
				return true;
			}
			if (newRow-_row==1) {
				var l=shapes.length;
				for(var i=l-1; i>=0; i--) {
					var shape=shapes[i];
					if(shape.getType()==WALL) {
						shapePos=shape.getWallPosition();
						shapeLayout=shape.getLayout();
						if(shapeLayout==HORIZONTAL && shapePos.row==newRow
								&& ((newCol-shapePos.col)==1 || (newCol-shapePos.col)==0))
							return false;
					}
				}
				return true;
			}
			//return false;
		}
		if(Math.abs(newRow-_row)==0) {
			if (newCol-_col==-1) {
				var l=shapes.length;
				for(var i=l-1; i>=0; i--) {
					var shape=shapes[i];
					if(shape.getType()==WALL) {
						shapePos=shape.getWallPosition();
						shapeLayout=shape.getLayout();
						if(shapeLayout==VERTICAL && shapePos.col==newCol+1 
								&& ((newRow-shapePos.row)==1 || (newRow-shapePos.row)==0))
							return false;
					}
				}
				return true;
			}
			if (newCol-_col==1) {
				var l=shapes.length;
				for(var i=l-1; i>=0; i--) {
					var shape=shapes[i];
					if(shape.getType()==WALL) {
						shapePos=shape.getWallPosition();
						shapeLayout=shape.getLayout();
						if(shapeLayout==VERTICAL && shapePos.col==newCol
								&& ((newRow-shapePos.row)==1 || (newRow-shapePos.row)==0))
							return false;
					}
				}
				return true;
			}
		}
		//zderzenie z pionem
		if(newCol-_col==0 && Math.abs(newRow-_row)==2) {
			var l=shapes.length;
			for(var i=l-1; i>=0; i--) {
				var shape=shapes[i];
				if(shape!=this && shape.getType()==PAWN) {
					var shapePos=shape.getPawnPosition();
					if((newRow-_row==-2 && newCol==shapePos.col && newRow+1==shapePos.row) 
					|| (newRow-_row==2 && newCol==shapePos.col && newRow-1==shapePos.row)	
					) {
						return true;
					}
				}
			}
			return false;
		}
		if(Math.abs(newCol-_col)==1 && Math.abs(newRow-_row)==1) {
			var l=shapes.length;
			for(var i=l-1; i>=0; i--) {
				var shape=shapes[i];
				if(shape!=this && shape.getType()==PAWN) {
					var shapePos=shape.getPawnPosition();
					if(((newCol-_col)==-1 && newCol+1==shapePos.col && newRow==shapePos.row) 
					|| ((newCol-_col)==1 && newCol-1==shapePos.col && newRow==shapePos.row)
					|| ((newRow-_row)==1 && newCol==shapePos.col && newRow-1==shapePos.row)
					|| ((newRow-_row)==-1 && newCol==shapePos.col && newRow+1==shapePos.row)
					) {
						return true;
					}
				}
			}
			return false;
		}
		return false;
	};

};

function Field(canvas, col, row) {

    var CANVAS = canvas;
    var _col=col;
    var _row=row;

    this.drawOnPosition=function(col, row) {
    	var fieldsSettings = SETTINGS.board.fields;
    	
        var width = fieldsSettings.size.width;
        var height = fieldsSettings.size.height;
        var strokeWidth = fieldsSettings.outline.width;

        CANVAS.lineWidth(strokeWidth)
            .strokeStyle(fieldsSettings.outline.color)
            .strokeRect(SETTINGS.board.offset.x + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + row * (width),
                SETTINGS.board.offset.y + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + col * (height),
                width, height
            )
            .fillStyle(SETTINGS.board.fields.color)
            .fillRect(SETTINGS.board.offset.x + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + row * (width) + 0.5 * strokeWidth,
                SETTINGS.board.offset.y + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + col * (height) + 0.5 * strokeWidth,
                width - 0.5 * strokeWidth, height - 0.5 * strokeWidth);
    };
    
    this.availableMove=function(shapes) {
    	var availableFields=[];
    	var l=shapes.length;
	    if(_col-1>=0) {
	    	for (var i=0; i<l; i++){
	    		if(shapes[i].getType()==WALL) {
	    			wallCol=shapes[i].getWallPosition().col;
	    			wallRow=shapes[i].getWallPosition().row;
	    			wallLayout=shapes[i].getLayout();
	    			if(wallLayout==VERTICAL && (wallRow==_row  || wallRow==_row-1) && wallCol==_col)
	    				break;
	    		}		
	    	}
	    	if(i==l)
	    		availableFields.push({col: _col-1, row: _row});
	    }
	    if(_col+1<=8) {
	    	for (var i=0; i<l; i++){
	    		if(shapes[i].getType()==WALL) {
	    			wallCol=shapes[i].getWallPosition().col;
	    			wallRow=shapes[i].getWallPosition().row;
	    			wallLayout=shapes[i].getLayout();
	    			if(wallLayout==VERTICAL && (wallRow==_row  || wallRow==_row-1) && wallCol==_col+1)
	    				break;
	    		}		
	    	}
	    	if(i==l)
	    		availableFields.push({col: _col+1, row: _row});
	    }
	    if(_row-1>=0) {
	    	for (var i=0; i<l; i++){
	    		if(shapes[i].getType()==WALL) {
	    			wallCol=shapes[i].getWallPosition().col;
	    			wallRow=shapes[i].getWallPosition().row;
	    			wallLayout=shapes[i].getLayout();
	    			if(wallLayout==HORIZONTAL && wallRow==_row && (wallCol==_col || wallCol==_col-1))
	    				break;
	    		}		
	    	}
	    	if(i==l)
	    		availableFields.push({col: _col, row: _row-1});
	    }
	    if(_row+1<=8) {
	    	for (var i=0; i<l; i++){
	    		if(shapes[i].getType()==WALL) {
	    			wallCol=shapes[i].getWallPosition().col;
	    			wallRow=shapes[i].getWallPosition().row;
	    			wallLayout=shapes[i].getLayout();
	    			if(wallLayout==HORIZONTAL && wallRow==_row+1 && (wallCol==_col || wallCol==_col-1))
	    				break;
	    		}		
	    	}
	    	if(i==l)
	    		availableFields.push({col: _col, row: _row+1});   	
    	}
   
    	return availableFields;
    };
};

function Board(canvasSelector) {

    var CANVAS = cq(canvasSelector);

    var FIELDS = undefined;
    (function computeMissingSettings() {

        var fieldsData = SETTINGS.board.fields;
        var fieldStrokeWidth = SETTINGS.board.fields.outline.width;

        var boardWidth = fieldsData.cols * fieldsData.size.width + 2 * SETTINGS.board.offsetFromBoardEdgeToFieldsSpace;
        var boardHeight = fieldsData.rows * fieldsData.size.height + 2 * SETTINGS.board.offsetFromBoardEdgeToFieldsSpace;

        SETTINGS.board.width = boardWidth;
        SETTINGS.board.height = boardHeight;

    })();

    (function initialize() {
        FIELDS = [];
        for (var col = 0; col < SETTINGS.board.fields.cols; col++) {
            FIELDS[col] = [];
            for (var row = 0; row < SETTINGS.board.fields.rows; row++) {
                FIELDS[col][row] = new Field(CANVAS, col, row);
            }
        }
    })();


    function drawBackground() {
    	var gradient = CANVAS.createLinearGradient(0,0,500,500 );
    	gradient.addColorStop(0, SETTINGS.background.color1);
    	gradient.addColorStop(1, SETTINGS.background.color2);
        CANVAS.fillStyle(gradient)
            .fillRect(SETTINGS.board.offset.x, SETTINGS.board.offset.y, SETTINGS.board.width, SETTINGS.board.height);
        CANVAS.lineWidth(SETTINGS.outline.width)
            .strokeStyle(SETTINGS.outline.color)
            .strokeRect(SETTINGS.board.offset.x, SETTINGS.board.offset.y, SETTINGS.board.width, SETTINGS.board.height);
    }

    function drawFields() {

        for (var col = 0; col < SETTINGS.board.fields.cols; col++) {
            for (var row = 0; row < SETTINGS.board.fields.rows; row++) {
                var field = FIELDS[col][row];
                field.drawOnPosition(col, row);
            }
        }

    }
    

    function drawStaticBoardElements() {
        drawBackground();
        drawFields();
    }
    
    var _getField=function(col,row) {
    	return FIELDS[col][row];
    };

    // This is called closure - known feature/pattern in JavaScript
    // I encourage you to get familiar with it
    return {
        drawGeneralStaticBoard: function () {
            drawStaticBoardElements(); 
        },
        getField: function(col,row) {
        	return _getField(col, row);
        }
    };

};

function Wall(player, i) {
	
	var _type=WALL;
	
	var _fill='#C00000';
	var _layout=VERTICAL;
	var _x=undefined , _y=undefined, _w=undefined, _h=undefined;
	var _player=player;
	var _isUsed=false;
	
	if(_player==WHITE) {
		_x=SETTINGS.board.offset.x
				+ SETTINGS.board.offsetFromBoardEdgeToFieldsSpace 
				+ SETTINGS.board.fields.cols*SETTINGS.board.fields.size.width 
				+ SETTINGS.wall.offset.x
				+ SETTINGS.wall.gap*i;
		_y=SETTINGS.wall.offset.y;
		_w=SETTINGS.wall.size.width;
		_h=SETTINGS.wall.size.height;
	}
	else if(_player==BLACK) {
		_x=SETTINGS.board.offset.x 
				+ SETTINGS.board.offsetFromBoardEdgeToFieldsSpace 
				+ SETTINGS.board.fields.cols*SETTINGS.board.fields.size.width 
				+ SETTINGS.wall.offset.x
				+ SETTINGS.wall.gap*i;
		_y=SETTINGS.wall.offset.y
				+ SETTINGS.board.fields.rows*SETTINGS.board.fields.size.height
				//+ SETTINGS.board.offsetFromBoardEdgeToFieldsSpace
				+ SETTINGS.board.offset.y;
		_w=SETTINGS.wall.size.width,
		_h=SETTINGS.wall.size.height;
	}
	
	var _defaultX=_x;
	var _defaultY=_y;
	var _defaultW=_w;
	var _defaultH=_h;
	
	this.draw=function(ctx) {
		ctx.fillStyle=_fill;
		ctx.fillRect(_x, _y, _w, _h);
	};

	this.contains=function(mx, my) {
		return (_x <= mx) && (_x+_w >=mx) &&
		(_y <= my) && (_y+_h>=my);
	};
	
	this.getCoordinates=function() {
		return {x: _x, y: _y};
	}
	
	this.setCoordinates=function(x, y) {
		_x=x;
		_y=y;
	};
	
	this.getSize=function() {
		return {w: _w, h: _h};
	};
	
	this.setSize=function(w, h) {
		_w=w;
		_h=h;
	};
	
	this.getLayout=function() {
		return _layout;
	};
	
	this.setLayout=function(layout) {
		_layout=layout;
	};
	
	this.getType=function() {
		return _type;
	};
	
	this.getWallPosition=function() {
		var col=(_x-SETTINGS.board.offset.y - SETTINGS.board.offsetFromBoardEdgeToFieldsSpace)
		/SETTINGS.board.fields.size.height;
		var row=(_y-SETTINGS.board.offset.x - SETTINGS.board.offsetFromBoardEdgeToFieldsSpace)
		/SETTINGS.board.fields.size.width;
		return {col: Math.round(col), row: Math.round(row), layout: _layout};
	};
	
	this.getDefaultWallPosition=function() {
		return { x: _defaultX, y: _defaultY, w: _defaultW, h: _defaultH };
	};
	
	this.validMove=function(newCol, newRow, newLayout, shapes) {
		if(_layout==VERTICAL && (newCol < 0 || newCol > SETTINGS.board.fields.cols 
				|| newRow < 0 || newRow > SETTINGS.board.fields.rows -2 )) {
			return false;
		}
		if(_layout==HORIZONTAL && (newCol < 0 || newCol > SETTINGS.board.fields.cols -2 
				|| newRow < 0 || newRow > SETTINGS.board.fields.rows)) {
			return false;
		}
		var l=shapes.length;
		for(var j=l-1; j>=0; j--) {
			var shape=shapes[j];
			if(shape.getType()==WALL) {
				shapePos=shape.getWallPosition();
				shapeLayout=shape.getLayout();
				if(shape!=this && newLayout==VERTICAL && newCol==shapePos.col 
						&& Math.abs(newRow-shapePos.row)<2 && newLayout==shapeLayout)
					return false;
				if(shape!=this && newLayout==HORIZONTAL && newRow==shapePos.row 
						&& Math.abs(newCol-shapePos.col)<2 && newLayout==shapeLayout)
					return false;
				if(shape!=this && newLayout==VERTICAL && shapeLayout==HORIZONTAL 
						&& newRow==shapePos.row-1 && newCol==shapePos.col+1)
					return false;
				if(shape!=this && newLayout==HORIZONTAL && shapeLayout==VERTICAL 
						&& newRow==shapePos.row+1 && newCol==shapePos.col-1)
					return false;
			}
		}
		return true;
	};
	
	this.getPlayerColor=function() {
		return _player; 
	};
	
	this.setPlayerColor=function(player) {
		_player=player
	};
	
	this.isUsed=function() {
		return _isUsed;
	};
	
	this.setUsed=function(used) {
		_isUsed=used;
	};
	
};

function drawBoard(board) {
    board.drawGeneralStaticBoard();
}

/* ---------------- */


function ServerGate(){

	// player = 0/1
	// targetPosition = {col:0,row:0}
	this.onPlayerMovedPawn = function(player, targetPosition){
		console.log("player: "+player+", col: "+targetPosition.col+", row: "+targetPosition.row);
		// TODO KJ
	};

	// player = 0/1
	// targetWallPosition
	this.onPlayerBuiltWall = function(player, targetWallPosition){
		console.log("player: "+player+", col: "+targetWallPosition.col+", row: "+targetWallPosition.row
				+", layout: "+targetWallPosition.layout);
		// TODO KJ
		// {
		// 	layout: "vertical", // "vertical"/"horizontal",
		// 	beginIndex: 0
		// }
	};
	/*
	 * METODA PRZEYSŁAJĄCA CAŁY STAN GRY PO RUCHU WYKONANYM PRZEZ GRACZA 
	 * */
	this.refreshGameState = function(shapes) {
		var l=shapes.length;
		var normalizedShapes=[];
		var _player, _layout;
		for(var i=0; i<l; i++) {
			if(shapes[i].getType()==PAWN) {
				_player=shapes[i].getPawnColor()
				normalizedShapes.push({
					type: PAWN,
					player: _player,
					targetPosition: {
						col: shapes[i].getPawnPosition().col,
						row: shapes[i].getPawnPosition().row,
						layout: undefined
					}
				});
			}
			else if(shapes[i].getType()==WALL && shapes[i].isUsed()) {
				_player=shapes[i].getPlayerColor();
				_layout=shapes[i].getLayout();
				normalizedShapes.push({
					type: WALL,
					player: _player,
					targetPosition: {
						col: shapes[i].getWallPosition().col,
						row: shapes[i].getWallPosition().row,
						layout: _layout
					}
				});
			}
		}
		/*
		 * tablica normalizedShapes zawiera informacje w takiej postaci jak powinny być przesłane na serwer
		 */
		// Reszta TODO KJ
		// TEST DZIAŁANIA
		l=normalizedShapes.length;
		for(i=0; i<l; i++) {
			console.log("type: "+normalizedShapes[i].type+", palyer: "+normalizedShapes[i].player
					+", col: "+normalizedShapes[i].targetPosition.col+", row: " +normalizedShapes[i].targetPosition.row
					+", layout: "+normalizedShapes[i].targetPosition.layout);
		}
	};



};

function ServerGateListener(state){
	
	var _state=state;
	
	// player = 0/1
	// targetPosition = {col:0,row:0}
	this.onPlayerMovedPawn = function(player, targetPosition){
		var l=_state.shapes.length;
		for (var i=l-1; i>=0; i--) {
			if(_state.shapes[i].getType()==PAWN && _state.shapes[i].getPawnColor()==player) {
				var x=SETTINGS.board.offset.y + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + targetPosition.col * SETTINGS.board.fields.size.height;
				var y=SETTINGS.board.offset.x + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + targetPosition.row * SETTINGS.board.fields.size.width;
				_state.shapes[i].setCoordinates(x, y);
				_state.shapes[i].setPawnPosition(targetPosition.col, targetPosition.row);
				_state.valid=false;
			}
		}
	};

	// player = 0/1
	// targetWallPosition
	this.onPlayerBuiltWall = function(player, targetWallPosition){
		var l=_state.shapes.length;
		for (var i=l-1; i>=0; i--) {
			if(_state.shapes[i].getType()==WALL && _state.shapes[i].getPlayerColor()==player 
					&& !(_state.shapes[i].isUsed())) {
				var x=SETTINGS.board.offset.y + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + targetWallPosition.col * SETTINGS.board.fields.size.height;
				var y=SETTINGS.board.offset.x + SETTINGS.board.offsetFromBoardEdgeToFieldsSpace + targetWallPosition.row * SETTINGS.board.fields.size.width;
				if(targetWallPosition.layout==VERTICAL) {
					x=x-SETTINGS.wall.size.width/2;
					_state.shapes[i].setSize(SETTINGS.wall.size.width, SETTINGS.wall.size.height);
					_state.shapes[i].setLayout(VERTICAL);
				}
				else if(targetWallPosition.layout==HORIZONTAL) {
					y=y-SETTINGS.wall.size.width/2;
					_state.shapes[i].setSize(SETTINGS.wall.size.height, SETTINGS.wall.size.width);
					_state.shapes[i].setLayout(HORIZONTAL);
				}
				_state.shapes[i].setCoordinates(x, y);
				_state.shapes[i].setUsed(true);
				_state.valid=false;
				break;
			}
		}
		// {
		// 	align: "vertical", // "vertical"/"horizontal",
		// 	beginIndex: 0
		// }
	};

	this.setEnabled = function(enabled){
		_state.setEnabled(enabled);
	};

	this.onGameEnded = function(winner){
		if(_state.getCurrentPlayer()==winner)
			alert("Gratualcje! Wygrałeś tę partię.");
		else
			alert("Niestety, tym razem twój przeciwnik był lepszy.");
	};
	
	//metoda odświeżająca cały stan gry
	//shapes-tablica obiektów zawierająca dwa piony i wszystkie ściany w użyciu
	/*
	 * Opis struktury obiektu shape:
	 * shape.type: PAWN=0 , WALL=1
	 * shape.player: WHITE=0, BLACK=1
	 * shape.targetPosition.col: liczba od 0 do 8 dla piona i od 0 do 9 dla ściany
	 * shape.targetPosition.row: liczba od 0 do 8 dla piona i od 0 do 9 dla ściany
	 * shape.targetPosition.layout: VERTICAL=0, HORIZONTAL=1
	 */
	this.refreshGameState=function(shapes) {
		_state.clear();
		l=_state.shapes.length;
		for(var j=0; j<l;j++) {
			_state.shapes[j].setCoordinates(undefined, undefined);
			if(_state.shapes[j].getType()==WALL)
				_state.shapes[j].setUsed(false);
			if(_state.shapes[j].getType()==PAWN)
				_state.shapes[j].setPawnPosition(undefined, undefined);
		}
		console.log(l);
		drawBoard(_state.getBoard());
		var ll=shapes.length;
		for(var i=0; i<ll; i++) {
			if(shapes[i].type==PAWN) {
				this.onPlayerMovedPawn(shapes[i].player, shapes[i].targetPosition);
			}
			else if(shapes[i].type==WALL) {
				this.onPlayerBuiltWall(shapes[i].player, shapes[i].targetPosition);
			}
		}
	};
	
	//ściany gotowe do uzycia dla danego uzytkownika
	this.setWallCount=function(player, wallCount) {
		var l;
		var _player=player;
		if(_player==WHITE) {
			for(var i=0; i<wallCount; i++) {
				l=_state.shapes.length;
				for(var j=0; j<l; j++) {
					if(_state.shapes[j].getType()==WALL && _state.shapes[j].getCoordinates().x==undefined) {
						_state.shapes[j].setCoordinates(SETTINGS.board.offset.x
								+ SETTINGS.board.offsetFromBoardEdgeToFieldsSpace 
								+ SETTINGS.board.fields.cols*SETTINGS.board.fields.size.width 
								+ SETTINGS.wall.offset.x
								+ SETTINGS.wall.gap*i,
								SETTINGS.wall.offset.y);
						_state.shapes[j].setPlayerColor(WHITE);
						break;
					}
				}
			}
		}
		else if(_player==BLACK) {
			for(var i=0; i<wallCount; i++) {
				l=_state.shapes.length;
				for(var j=0; j<l; j++) {
					if(_state.shapes[j].getType()==WALL && _state.shapes[j].getCoordinates().x==undefined) {
						_state.shapes[j].setCoordinates(SETTINGS.board.offset.x 
							+ SETTINGS.board.offsetFromBoardEdgeToFieldsSpace 
							+ SETTINGS.board.fields.cols*SETTINGS.board.fields.size.width 
							+ SETTINGS.wall.offset.x
							+ SETTINGS.wall.gap*i,
							SETTINGS.wall.offset.y
							+ SETTINGS.board.fields.rows*SETTINGS.board.fields.size.height
							//+ SETTINGS.board.offsetFromBoardEdgeToFieldsSpace
							+ SETTINGS.board.offset.y);
						_state.shapes[j].setPlayerColor(BLACK);
						break;
					}
				}
			}
		}
		_state.valid=false;
	};
	
	//garcz ktory aktualnie wykonuje ruch
	this.setActivePlayer=function(player) {
		console.log("ActivePlayer " + player);
		if(_state.getCurrentPlayer()==player) {
			_state.setEnabled(true);
			_state.img_visible=true;
		}
		else {
			_state.setEnabled(false);
			_state.img_visible=false;
		}
		_state.valid=false;		
	};
	
	//garcz lokalny
	this.setCurrentPlayer=function(player) {
		_state.setCurrentPlayer(player);
	};
};








