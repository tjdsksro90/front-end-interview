// 방문 기록 한 칸(location.key)마다 값을 sessionStorage에 기억한다.
// 뒤로/앞으로 가기로 같은 기록에 돌아오면 key가 같으므로 그때 저장한 값을 다시 꺼낼 수 있다.
// 새로 링크를 눌러 들어오면 key가 새로 만들어지므로 처음 상태로 시작한다.

const storage = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null; // 사파리 개인 정보 보호 모드 등에서 접근이 막히면 기억 없이 동작
  }
};

export function remember(key, name, value) {
  try {
    storage()?.setItem(`${name}:${key}`, JSON.stringify(value));
  } catch {
    /* 저장 공간이 꽉 찬 경우 등은 무시 */
  }
}

export function recall(key, name) {
  try {
    const raw = storage()?.getItem(`${name}:${key}`);
    return raw == null ? undefined : JSON.parse(raw);
  } catch {
    return undefined;
  }
}
