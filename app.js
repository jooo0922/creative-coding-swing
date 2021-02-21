'use strict'

import {
  Point
} from './point.js';

import {
  Dialog
} from './dialog.js';

class App {
  constructor() {
    this.canvas = document.createElement('canvas');
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.pixelRatio = window.devicePixelRatio > 1 ? 2 : 1;

    // 처음에 new Point()에 파라미터를 아무것도 전달하지 않았기 때문에
    // mousePos.x, y에는 각각 0이 할당될 거임.
    this.mousePos = new Point();
    this.curItem = null; // 얘는 클릭한 상자에 대한 dialog 인스턴스가 들어감.

    this.items = []; // Dialog 인스턴스를 담아두는 곳
    this.total = 1; // Dialog(노란색 상자)를 총 몇개 생성할 것인지 정해줌
    for (let i = 0; i < this.total; i++) {
      this.items[i] = new Dialog(); // total 개수만큼 생성한 뒤 this.items에 차례대로 담아둠.
    }

    window.addEventListener('resize', this.resize.bind(this), false);
    this.resize();

    window.requestAnimationFrame(this.animate.bind(this));

    // DOM 문서 전체(즉 브라우저 전체)에 pointer 누르고, 움직이고, 떼는 이벤트를 3단계로 나눠서 걸어놓음.
    document.addEventListener('pointerdown', this.onDown.bind(this), false);
    document.addEventListener('pointermove', this.onMove.bind(this), false);
    document.addEventListener('pointerup', this.onUp.bind(this), false);
  }

  resize() {
    this.stageWidth = document.body.clientWidth;
    this.stageHeight = document.body.clientHeight;

    this.canvas.width = this.stageWidth * this.pixelRatio;
    this.canvas.height = this.stageHeight * this.pixelRatio;
    this.ctx.scale(this.pixelRatio, this.pixelRatio);

    // canvas2DContext의 shadow의 크기, blur, color등을 정해주는 api들
    this.ctx.shadowOffsetX = 0;
    this.ctx.shadowOffsetY = 3;
    this.ctx.shadowBlur = 6; // blur의 정도를 정의해 줌. 0은 blur없음으로 처리.
    this.ctx.shadowColor = `rgba(0, 0, 0, 0.1)`

    this.ctx.lineWidth = 2; // this.ctx에 그려지는 모든 line들의 두께는 2로 지정함.

    // 이 for loop는 캔버스에 그려질 상자의 개수만큼, 즉 this.total 개수만큼 수행될거임.
    for (let i = 0; i < this.items.length; i++) {
      // 각각의 Dialog들 안에 들어있는 resize 메소드에다가 리사이징된 브라우저의 width, height을 전달해서 호출함.
      // 이 리사이징된 브라우저 사이즈에 따라 상자가 위치할 수 있는 좌표값의 범위가 정해지겠지? 
      this.items[i].resize(this.stageWidth, this.stageHeight);
    }
  }

  animate() {
    window.requestAnimationFrame(this.animate.bind(this)); // 내부에서 호출에서 스스로 반복

    this.ctx.clearRect(0, 0, this.stageWidth, this.stageHeight); // 매 프레임마다 싹 한 번 지워주고 시작.

    // this.total의 개수만큼 for loop 돌려서 노란색 상자를 캔버스에 그려줌.
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].animate(this.ctx);
    }

    // this.curItem이 존재한다면 if block 실행
    // 즉 pointer로 어떤 상자를 클릭했다면 if block을 실행할 것.
    if (this.curItem) {
      // 상자를 클릭했을 때 나오는 빨간 점들과 줄을 그려주려는 거임. 
      this.ctx.fillStyle = `#ff4338`;
      this.ctx.strokeStyle = '#ff4338';

      // 현재 pointerdown 또는 pointermove 하고 있는 지점에 빨간 점을 그려줌.
      this.ctx.beginPath();
      this.ctx.arc(this.mousePos.x, this.mousePos.y, 8, 0, Math.PI * 2);
      this.ctx.fill();

      // 상자안에 pointerdown한 좌표값과 거의 근사한 지점(centerPos.x,y)에도 빨간 점을 그려줌.
      this.ctx.beginPath();
      this.ctx.arc(this.curItem.centerPos.x, this.curItem.centerPos.y, 8, 0, Math.PI * 2);
      this.ctx.fill();

      // 위에서 그린 두 빨간 점을 빨간 줄로 연결해주는 거
      this.ctx.beginPath();
      this.ctx.moveTo(this.mousePos.x, this.mousePos.y);
      this.ctx.lineTo(this.curItem.centerPos.x, this.curItem.centerPos.y);
      this.ctx.stroke();
    }
  }

  onDown(e) {
    // pointer를 누른 지점의 clientX, Y값을 mousePos.x, y 값에 할당해 줌.
    this.mousePos.x = e.clientX;
    this.mousePos.y = e.clientY;

    // 또 for loop를 items의 마지막 index부터 처리해줌. 
    // 즉, 가장 나중에 생성된 박스부터 처리하겠지
    for (let i = this.items.length - 1; i >= 0; i--) {
      /**
       * pointerdown된 지점의 x, y좌표값으로 point 인스턴스를 만들고,
       * 얘를 각 dialog들의 down메소드에 전달해서 호출해줌.
       * down메소드에서 return받은 결과값을 item에 할당해줌.
       * 
       * 그럼 어떻게 되는걸까?
       * 만약 this.items[i]에 해당하는 상자 안쪽을 pointerdown 했다면,
       * 해당 dialog의 this.isDown, startPos, downPos, mousePos가 override된 새로운 dialog가
       * const item에 할당될 것임.
       * 
       * 그러나 만약에 해당 상자 바깥쪽을 pointerdown 했다면,
       * const item에는 null값이 할당될 거임.
       * 
       * 근데 if block 맨 밑줄에 보면 break가 되어있지?
       * 해당 상자 안쪽을 pointerdown해서 if block을 수행했다면 for loop를 중단하고,
       * 
       * 해당 상자 바깥쪽을 pointerdown해서 if block을 수행하지 못한다면 계속 for loop를 돌면서
       * 이 pointerdown한 지점의 좌표값이 this.items에 들어있는 상자들(dialog 인스턴스들) 중 어느 상자에
       * 속하는지 이 지점에서 계속 확인해보는 거임. 
       * 
       * 모든 this.items[i]들이 null값으로 나온다? 그럼 어느 상자도 클릭하지 않는거임.
       */
      const item = this.items[i].down(this.mousePos.clone());

      // 따라서 상자 안쪽을 pointerdown해야 if block이 수행되고, 그렇지 않으면 수행을 안함.
      if (item) {
        // this.curItem에는 현재 클릭한 상자에 대한 dialog 인스턴스가 들어가게 됨.
        this.curItem = item;

        // item에는 새롭게 override된 dialog 인스턴스가 들어가는데, 이게 items에 존재할 리 없지.
        // indexOf는 해당 배열에 존재하지 않는 요소에 대해서는 -1을 return함.
        // 따라서 const index에는 -1이 들어가겠지
        const index = this.items.indexOf(item);

        /**
         * 먼저 this.items의 -1(즉, 마지막 인덱스의 dialog.) 1개만 splice(제거)해줌.
         * 
         * 그리고 나서 마지막 인덱스가 제거된 상태의 this.items에서 첫번째 인덱스를
         * 스스로에게 다시 push해줌.
         * 
         * 그니까 정리를 좀 해보자면, 
         * pointerdown이 어떤 상자 하나를 클릭한 게 맞다면,
         * 상자에 해당하는 dialog의 몇가지 field들에 대해 down메소드로 수정해서 const item에 넣어주고, 
         * 수정된 dialog 인스턴스를 this.curItem에는 넣어준다.
         * 그리고 나서 this.items의 마지막 인덱스에 존재하는 dialog를 삭제한 다음,
         * 그 상태에서 this.items의 첫번째 인덱스에 존재하는 dialog를
         * 삭제된 마지막 인덱스 자리에 복사해서 push해준다.
         * 그리고 for loop를 중단하고 빠져 나온다.
         */
        this.items.push(this.items.splice(index, 1)[0]);

        // item이 null값이 아니면 if block을 수행하고 for loop를 멈춤.
        // 그니까 상자 안쪽을 클릭했다면 if block을 수행한 뒤 for loop를 중단하고,
        // 상자 바깥쪽을 클릭했다면 계속 for loop를 돌려보면서
        // pointerdown한 지점이 어느 상자에 해당하는지 계속 돌려보는거임.
        break;
      }
    }
  }

  onMove(e) {
    // pointer를 움직이는 지점의 clientX, Y값을 mousePos.x, y 값에 계속 override 줌.
    this.mousePos.x = e.clientX;
    this.mousePos.y = e.clientY;

    // 또 pointer를 움직이면 현재 this.items안에 담긴 dialog 개수만큼 for loop를 돌림
    for (let i = 0; i < this.items.length; i++) {
      // 현재 this.items의 모든 dialog들에
      // 마우스를 움직인 좌표값을 point 객체로 만들어 전달해서
      // move 메소드를 수행해 주는거지.
      // 결국 this.items의 모든 this.target값이 override 되겠지

      // 단, 항상 모든 dialog의 this.target값이 override되는 건 아니고,
      // pointerdown이 된 상태에서만 this.items의 전체 dialog의 this.target이 override됨.
      // dialog.js의 move() 메소드를 참고하면서 볼 것. 
      this.items[i].move(this.mousePos.clone());
    }
  }

  onUp(e) {
    // pointer를 떼버렸을 때는
    // this.curItem에 만약 어떤 상자가 클릭되서 그 상자의 수정된 dialog가 들어가 있다면
    // this.curItem값을 다시 초기화해주고
    this.curItem = null;

    // this.items 안에 있는 모든 dialog들의 this.isDown값을 false로 만들어줌.
    // 이렇게 되면 마우스를 움직여서 onMove 콜백이 발생하더라도
    // 각각의 this.items안에 dialog들의 this.target을 override 할 수 없겠지. 
    for (let i = 0; i < this.items.length; i++) {
      this.items[i].up();
    }
  }
}

window.onload = () => {
  new App();
}