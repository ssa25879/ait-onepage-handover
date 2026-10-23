function PrivacyNotice() {
  return (
    <aside className="privacy-note">
      <p>기록은 이 기기에만 저장돼요. 기기를 바꾸거나 앱 데이터를 초기화하면 복원되지 않고, 서버 백업도 제공하지 않아요.</p>
      <p>고객 개인정보, 비밀번호, 사업장 기밀은 입력하지 마세요.</p>
      <p>중요한 내용은 따로 보관하고, 클립보드에서 외부 앱으로 전달할 때 붙여넣는 곳을 확인해 주세요.</p>
      <p>광고가 표시될 때 광고 SDK가 네트워크를 사용할 수 있지만 기록 본문은 광고에 전달하지 않아요.</p>
    </aside>
  );
}

export default PrivacyNotice;
