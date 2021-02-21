import {
  Point
} from './point.js';

const FOLLOW_SPEED = 0.08;
const ROTATE_SPEED = 0.12;
const MAX_ANGLE = 30;
const FPS = 1000 / 60; // 60fps 상에서 다음 프레임으로 넘어가는데 걸리는 밀리세컨드(ms) 단위의 시간. 약 16.66...ms
const WIDTH = 260;
const HEIGHT = 260;

// 노란색 상자를 생성해주고 상자의 움직임과 관련된 좌표값들을 계산해 줌.
export class Dialog {
  constructor() {
    this.pos = new Point();
    this.target = new Point();
    this.prevPos = new Point();
    this.downPos = new Point();
    this.startPos = new Point();
    this.mousePos = new Point();
    this.centerPos = new Point();
    this.origin = new Point(); // 여기까지는 모두 this.x, y가 0으로 할당될 거임.
    this.rotation = 0;
    this.sideValue = 0;
    this.isDown = false;
  }

  resize(stageWidth, stageHeight) {
    // 위에 생성자에서 만들어진 this.pos.x 에는 0 ~ (브라우저 width - 260) 사이의 랜덤값이 할당될거고
    // this.pos.y 에도 0 ~ (브라우저 height - 260) 사이의 랜덤값이 할당될거임.
    this.pos.x = Math.random() * (stageWidth - WIDTH);
    this.pos.y = Math.random() * (stageHeight - HEIGHT);

    // this.target, this.prevPos에는 위에서 리사이징된 브라우저 사이즈 범위 내에서 
    // 랜덤으로 할당받는 상자의 시작점 좌표가 할당됨.
    this.target = this.pos.clone();
    this.prevPos = this.pos.clone();
  }

  // 상자를 그려주는 animate 메소드
  animate(ctx) {
    // const move에는 move메소드에서 override된 this.target의 현재 좌표값으로 point 객체를 만든 뒤
    // 상자의 x, y위치 좌표값을 빼주고, 거기에 0.08(FOLLOW_SPEED)를 곱해서 할당해 줌.
    // 그럼 결과적으로 move에는 매 프레임마다 
    // (마우스 움직인 좌표값 - 상자안에 클릭한 좌표값) * 0.08 을 해준 값이 들어간 것. 
    // -> 벡터값인데? 변화량만 있잖아. 마우스 움직인 지점과 상자안에 클릭지점 사이의 거리만큼이 들어있음.
    // 두 지점의 거리의 0.08배 수준의 미세한 거리값만큼 상자위 위치값(this.pos)에 매 프레임마다 추가해주는거
    // 그럼 어떻게 되겠어? 매 프레임마다 this.pos는 점점 마우스 움직인 좌표값(this.target)에 가까워질거고
    // 그럼 둘 사이의 거리가 좁아지니까 0.08배한 move값도 점점 더 작아지겠네?
    // 그럼 매 프레임마다 점점 더 작아지는 move만큼 상자의 위치값(this.pos)가 이동하겠지?
    // 이런식으로 상자가 this.target 지점까지 감속이동을 할 수 있도록 구현한 것.
    const move = this.target.clone().subtract(this.pos).reduce(FOLLOW_SPEED);
    this.pos.add(move); // 매 프레임마다 줄어드는 move값을 현재 상자의 위치값에 더해줌.

    // move만큼의 벡터값이 더해진 this.pos의 x, y좌표값에
    // this.mousePos(상자 안의 pointerdown한 지점과 상자의 시작점 사이의 벡터값)을 더해줘서
    // this.centerPos에 할당함. 
    // -> 사실상 this.centerPos에는 상자 안의 pointerdown한 지점과 거의 가까운 x,y좌표값이 들어가게 됨.
    this.centerPos = this.pos.clone().add(this.mousePos);

    // ctx.beginPath();
    // ctx.fillStyle = `#f4e55a`
    // ctx.fillRect(this.pos.x, this.pos.y, WIDTH, HEIGHT);
    // 이래서 WIDTH, HEIGHT을 빼줬던 거구나! 이 값들만큼 안빼주면 상자를 WIDTH, HEIGHT 만큼 그려줄 때 
    // 브라우저 바깥으로 짤려서 그려질 수도 있으니까 상자 자체가 브라우저 안쪽에 그려지게 하려고...
    // 어쨋든 상자는 브라우저 상의 아무곳에나 랜덤하게 그려질 수 있게 되겠지?
    // 근데 얘내들은 이동 시 swing하지 않는 상자를 그릴 때 쓰던 코드였고
    // 밑에 swingDrag()를 이용해서 흔들리는 상자를 그려보자

    this.swingDrag(ctx);

    // 매 프레임마다 animate 메소드에서 this.pos.add(move)로 값을 조금씩 바꿔주고 있으니까
    // this.prevPos에는 항상 이전 프레임에서 상자의 위치값이 할당됨.
    this.prevPos = this.pos.clone();
  }

  // 상자를 드래그해서 이동시킬 때 swing 효과를 만들어주는 메소드.
  // 기본적으로 상자가 swing하려면 상자를 매 프레임마다 rotate 시켜야겠지?
  swingDrag(ctx) {
    const dx = this.pos.x - this.prevPos.x; // 이전 프레임에서 현재 프레임으로 상자의 위치값의 x좌표가 이동한 거리
    const speedX = Math.abs(dx) / FPS; // 이동한 거리의 절댓값을 프레임 이동에 걸리는 시간(16.666..ms)로 나눠줌.
    // 이거는 '속력 = 거리 / 시간' 공식으로 볼 수 있겠네?
    // 한 프레임이 넘어갈 때 상자 위치값의 x좌표가 이동한 거리를 한 프레임이 넘어갈 때 걸린 시간으로 나눈거잖아.
    // 그니까 상자 위치값의 x좌표가 이동한 속도값이 speedX에 정의된 거지.

    const speed = Math.min(Math.max(speedX, 0), 1);
    // 이거는 speedX값이 0과 1 사이의 값일 때에만 return해서 할당해주려는 것. 
    // Math.min, max를 이용해서 'speedX값의 범위를 제한'하는 거임. 값의 범위를 제한하는 공식 자주 사용됨. 기억해둘 것.
    /**
     * 결과적으로, 상자의 x위치값이 빨리 이동했다면
     * 즉, 동일한 16.66..ms 시간 동안 더 많이 이동했다면
     * (이 때, 한 프레임에서 다음 프레임으로 16.66..px 보다 많이 이동한 건 걸러짐. 왜? 위의 Math.min, max가 걸러주고 있잖아.)
     * speed는 1에 가까울 것이고, 
     * 
     * 상자의 x위치값이 느리게 이동했다면
     * speed는 0에 가까운 값이 되겠지?
     */

    // 최대 회전각(MAX_ANGLE = 30)을 한 프레임에서 다음 프레임으로 상자가 이동한 속도에 비례하여 곱해줌.
    // 빨리 이동할수록 최대 회전각인 30도에 가까운 회전각이 rotation에 할당되고
    // 느리게 이동할수록 0도에 가까운 회전각이 할당될거임.
    // 위에서 speed의 최댓값을 1로 제한함으로써, rotation에 할당되는 각도 또한 최대 30도로 제한됨.
    // 암만 빠르게 상자를 움직여도 상자는 30도 이상으로 회전되지가 않는다는 뜻.
    let rotation = (MAX_ANGLE / 1) * speed;

    /**
     * dx가 음수라면, 
     * 즉 이전 프레임에서 현재 프레임으로 상자를 '왼쪽으로' 이동시켰다면, -1을 리턴하여
     * rotation * -1을 해서 음수로 만듦. 회전각이 음수가 되면 반시계방향으로 회전함.
     * 
     * 반대로 dx가 양수라면,
     * 즉, 이전 프레임에서 현재 프레임으로 상자를 '오른쪽으로' 이동시켰다면, 1을 리턴하여
     * rotation * 1을 해서 양수로 만듦. 회전각이 양수가 되면 시계방향으로 회전함.
     * 
     * 정리를 하면, 
     * 상자를 왼쪽으로 이동하면 반시계방향으로 회전하고, 
     * 오른쪽으로 이동하면 시계방향으로 회전하도록 해준 것.
     * 
     * 또한, -this.sideValue를 해줌으로써,
     * 상자의 어느 부분에서 클릭해서 이동시키느냐에 따라 회전 각도를 약간씩 다르게 해줌.
     * 어차피 this.sideValue 자체는 값이 그리 크지 않기 때문에(왼쪽 끝 클릭시 -0.5 ~ 오른쪽 끝 클릭 시 0.5)
     * 회전각이 최대 0.5도 정도밖에 차이가 안나겠지만,
     * 
     * 상자의 왼쪽 부분을 클릭해서 오른쪽으로 이동시킬수록 좀 더 회전시켜주고,
     * 상자의 왼쪽 부분을 클릭해서 왼쪽으로 이동시킬수록 좀 덜 회전시켜주는 정도.
     * 
     * 상자의 오른쪽 부분을 클릭했을 때도 마찬가지로 반대 방향으로 이동시킬수록 좀 더 회전시켜주는 거지.
     * 
     * 큰 차이는 없지만 실제 물리 현상의 미묘한 차이를 더 세심하게 구현해 놓은 것 같음.
     */
    rotation = rotation * (dx > 0 ? 1 : -1) - this.sideValue;

    /**
     * rotation vs this.rotation 차이점
     * 
     * rotation에는 상자의 어느 부분에서 클릭해서 어느 방향으로 얼만큼 이동했느냐에 따라
     * 현재 프레임에서 다음 프레임까지의 '목표 회전각'이 할당되어 있음.
     * '상자를 이 방향으로 이만큼 이동시켰으면 이 정도는 회전시켜야 해!'에 해당하는 각도가 할당됨.
     * 
     * 반면 이 부분에서 this.rotation은 이전 프레임에서 상자가 얼만큼 회전되어 있었는지
     * 이전 프레임에서의 상자의 회전 각도가 할당되어 있음.
     * 물론, 아래에서 ctx.rotate(this.rotation)에 위치한 this.rotation은 
     * 현재 프레임에서 회전시키려는 각도가 할당되어 있지만,
     * 이 부분에 있는 this.rotation에는 이전 프레임에서의 상자의 회전각도가 할당되어 있음.
     * 
     * 결국 (목표 상자 회전각 - 이전 프레임 상자 회전각) * 0.12를 해준 값을
     * 이전 프레임 상자 회전각에 더해줌으로써 
     * 그 각도만큼 현재 프레임에서 상자를 회전시켜주라는 뜻.
     * 
     * 참고로 0.12를 곱하니까 이전 프레임 회전각이 0이고 최대 목표 회전각이 30일 때조차도
     * 30 * 0.12 = 3.6도 밖에 회전시켜주지 못함. 
     * 즉, 아무리 빨라도 한 프레임에서 3.6도보다 많이 회전시켜주지는 못한다는 뜻.
     * 이 ROTATE_SPEED값이 커질수록 한 프레임에서 더 많이 회전시킬 수 있을테니 빨리 회전하겠지?
     * 
     * 또 참고로 만약 이전 프레임 회전각인 this.rotation이 30이라면,
     * rotation의 최대값은 30이기 때문에,
     * 목표 회전각(rotation)이 최대값인 30이 될 정도로 빠르게 움직이더라도 
     * (30 - 30) * 0.12 = 0 이므로 현재 프레임에서 회전각의 변화가 없게 됨.
     * 또한 목표 회전각(rotation)이 30이 안된다면
     * (rotation - this.rotation) * ROTATE_SPEED의 결과값이 음수가 되어버려서 
     * 현재 프레임에서 회전각은 30보다 작아질 수밖에 없음.
     * 
     * 결론적으로 말하자면, this.rotation(이전 프레임의 회전각 또는 현재 프레임에서 회전시키려는 각도)는
     * 30도를 넘지 못함. 
     */
    this.rotation += (rotation - this.rotation) * ROTATE_SPEED;
    // 여기까지는 매 프레임마다 상자를 회전시킬 각도를 구해줌.

    /**
     * tmpPos는 rotate 및 상자 생성의 기준이 되는 원점의 좌표값을 구해줌.
     * 
     * 상자의 위치값에 this.origin(사실상 this.mousePos랑 같음)을 더해줌.
     * 즉, 상자 위치값 + this.mousePos(상자 안에 pointerdown한 지점과 상자 위치값 사이의 거리)
     * 그럼 결국 tmpPos에는 상자 안에 pointerdown한 지점의 좌표값이 들어가겠지.
     */
    const tmpPos = this.pos.clone().add(this.origin);

    // 여기서 부터는 위에서 구한 각도, 원점을 넣어서 매 프레임마다 사각형을 그려주는 거겠지
    ctx.save(); // 일단 초기의 원점 (0, 0)을 저장해놓고
    ctx.translate(tmpPos.x, tmpPos.y); // 상자 안에 pointerdown한 지점의 좌표값(tmpPos.x, y)을 원점으로 재설정하고
    ctx.rotate(this.rotation * Math.PI / 180); // 상자 안에 pointerdown한 지점을 중심으로 상자 각도를 정해 rotate시키고 (물론 radian값으로도 변환해주고)
    ctx.beginPath(); // 상자를 그리기 시작함
    ctx.fillStyle = `#f4e55a`; // 상자 노란색 찍어주고

    // 상자 안에 pointerdown한 지점의 좌표값에서 (상자 안에 pointerdown한 지점과 상자 위치값 사이의 거리)를 빼준 만큼의 지점에서
    // 사각형을 그리기 시작하라는 것.
    // 이렇게 위치를 설정해줬기 때문에 매 프레임마다 그려지는 상자는
    // pointerdown한 빨간점에서 항상 -this.origin.x,y 한 지점만큼 떨어진 부분부터 그려지는 것.
    ctx.fillRect(-this.origin.x, -this.origin.y, WIDTH, HEIGHT);
    ctx.restore(); // 원점을 다시 (0, 0)으로 복구시켜주고 나서 다음 프레임으로 넘어가도록 함.
  }

  down(point) {
    /**
     * 아래의 if 조건문을 해석해보자면(point.js의 collide 메소드 참고),
     * down 메소드에서 어떤 Point 인스턴스를 파라미터로 전달받았고,
     * 이 point안의 collide 메소드를 호출하면서 현재 상자의 x, y 좌표값, 상자의 width, height을 전닳한거임.
     * 
     * 그에 따라 해당 Point 인스턴스의 x, y좌표값이
     * this.pos.x <= point.x <= this.pos.x + WIDTH
     * this.pos.y <= point.y <= this.pos.y + HEIGHT
     * 안에 존재해야 true를 return받아서 if block을 수행할 수 있는 상황.
     * 
     * 즉, 해당 Point가 상자안에 위치할 때 if block을 수행하는 것. 
     * 지금 메소드의 이름 down을 보면 알겠지만, pointerdown 이벤트가 발생했을 때,
     * pointer로 상자를 클릭했을때 if block을 수행하라는 거겠지? 
     * 
     * 이거 캔버스 튜토리얼에서 canvas에 interaction 걸어주는 방법으로 이미 해봤던 거.
     */
    if (point.collide(this.pos, WIDTH, HEIGHT)) {
      this.isDown = true; // isDown의 boolean값을 true로 바꿔주고 (즉, 상자를 'pointerdown 했음'을 알려줌.)
      this.startPos = this.pos.clone(); // this.startPos에 상자의 x, y좌표값이 담긴 point를 생성해 override 해줌
      this.downPos = point.clone(); // this.downPos에 상자 안쪽에 pointerdown한 지점의 x, y좌표값이 담긴 point를 생성해 override 해줌.
      this.mousePos = point.clone().subtract(this.pos);
      // 마찬가지로 this.mousePos에 상자 안쪽에 pointerdown한 지점의 x, y좌표값이 담긴 point를 생성한 뒤,
      // pointer 클릭한 지점의 x, y좌표값 각각에 상자의 x, y좌표값(this.pos)를 빼준 값이 담긴 point를 return하여 override해줌.
      // 뭔가 이 값은 pointerdown한 지점과 상자의 시작점(this.pos)의 좌표값끼리 subrtact해준거니까
      // this.mousePos.x, y의 제곱의 합을 Math.sqrt 하면 두 지점 사이의 거리를 구할 수 있을 것 같기도 한데..? -> 벡터값?

      // this.mousePos는 상자 안에 pointerdown한 지점과 상자의 시작점 사이의 x, y 벡터값(거리값)
      // 즉, 두 지점 사이의 x방향의 거리를 상자의 WIDTH(260)으로 나눈 값을 xRatioValue로 정의해줌.
      // 즉, 상자의 왼쪽 끝을 클릭하면 0, 오른쪽 끝을 클릭하면 1이 나오겠지? 
      // 일종의 상자를 클릭한 지점의 WIDTH 상에서의 비율값이네.
      const xRatioValue = this.mousePos.x / WIDTH;

      // 상자 안에서 pointerdown한 지점의 x좌표값이 WIDTH 상에서 어느 비율 지점에 위치하느냐에 따라 그 길이가 계산될거임.
      // 왜냐면 전체 상자의 WIDTH에서 상자를 클릭한 지점의 x좌표값의 WIDTH 상에서의 비율값을 곱해준거니까!
      // 결론적으로 말하면, this.origin.x에는 
      // 상자 시작점 x좌표와 상자 안에 pointerdown한 지점의 x좌표 사이의 거리값이 들어감.
      // this.origin.y도 마찬가지.
      this.origin.x = WIDTH * xRatioValue;
      this.origin.y = HEIGHT * this.mousePos.y / HEIGHT;
      // 근데 얘내들 값은 사실상 this.mousePos.x, y값이랑 똑같음. 왜냐면 애초에 얘내도 벡터값(거리값) 이었으니까.

      // 상자를 클릭한 지점의 비율값에 0.5(상자 WIDTH의 가운데 위치의 비율값)을 빼준 값이겠지?
      // 상자의 왼쪽 끝을 클릭하면 -0.5, 오른쪽 끝을 클릭하면 0.5가 할당될거임.
      this.sideValue = xRatioValue - 0.5;

      return this; // 위의 4개의 fields값이 바뀐 Dialog 인스턴스를 return해줌.
    } else {
      return null; // 상자 내부를 클릭한 게 아니라면 null을 return해줌.
    }
  }

  move(point) {
    // this.isDown = true일 때에만 if block을 실행하도록 함.
    // pointerdown한 상태에서(즉, down()메소드가 실행되고 나서!) pointermove 해야만 if block을 수행함
    if (this.isDown) {
      this.target = this.startPos.clone().add(point).subtract(this.downPos);
      /**
       * 먼저 if block은 위의 down()메소드가 실행된 이후에야 수행이 되니까
       * this.startPos에는 상자의 x,y좌표값이 담긴 point(this.pos)가 들어가 있겠지?
       * 
       * 이 this.startPos 인스턴스를 복사한 뒤, 
       * 거기에 마우스가 움직인 지점의 x, y좌표값을 각각 더해주고,
       * this.downPos의 x,y좌표값(down()메소드에서 상자 안쪽에 pointerdown한 지점의 x, y좌표값이 복사되어 들어감.)을
       * 빼준 최종 x, y좌표값이 담긴 point 인스턴스를 this.target에 override 해줌.
       * 
       * 정리 좀 해보면, 상자의 x, y 위치 좌표값에 마우스가 움직여서 현재 위치한 x, y 좌표값을 더해주고,
       * 거기에 상자 안의 클릭한 지점의 x, y좌표값을 빼준 좌표값을 this.target에 넣어주게 됨. 
       * 얘도 down()메소드의 this.mousePos와 마찬가지로 
       * (상자의 시작점 + 마우스를 움직여 위치한 점을 더한 곳)과 (pointerdown한 지점) 사이의 거리를 구할 수 있을것 같기도 한데? -> 벡터값?  
       */
    }
  }

  up(point) {
    this.isDown = false; // pointer를 떼면 this.isDown을 false로 바꿔서 pointermove해도 move() 메소드의 if block을 수행하지 못하게 해줌
  }
}