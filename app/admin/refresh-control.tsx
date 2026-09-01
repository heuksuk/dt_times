"use client";

import { useState } from "react";

export default function RefreshControl({ checkedAt }: { checkedAt: string }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  function refresh() {
    setIsRefreshing(true);
    window.location.reload();
  }

  return (
    <div className="admin-refresh">
      <span>마지막 확인 {checkedAt}</span>
      <button className="text-button" disabled={isRefreshing} onClick={refresh} type="button">
        {isRefreshing ? "새로고침 중..." : "현황 새로고침"}
      </button>
    </div>
  );
}
