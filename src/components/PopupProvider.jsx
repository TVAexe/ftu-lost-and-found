/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const PopupContext = createContext(null);

const popupStyles = {
  success: {
    icon: "✓",
    iconClass: "bg-emerald-100 text-emerald-700",
    title: "Thành công",
  },
  error: {
    icon: "!",
    iconClass: "bg-red-100 text-red-700",
    title: "Có lỗi xảy ra",
  },
  info: {
    icon: "i",
    iconClass: "bg-blue-100 text-blue-700",
    title: "Thông báo",
  },
};

export function PopupProvider({ children }) {
  const [popup, setPopup] = useState(null);

  const closePopup = useCallback(() => setPopup(null), []);

  const showPopup = useCallback((message, type = "info") => {
    setPopup({ id: Date.now(), message, type });
  }, []);

  useEffect(() => {
    if (!popup) return undefined;

    const timeoutId = window.setTimeout(closePopup, 4500);
    return () => window.clearTimeout(timeoutId);
  }, [popup, closePopup]);

  const style = popupStyles[popup?.type] || popupStyles.info;

  return (
    <PopupContext.Provider value={{ showPopup, closePopup }}>
      {children}
      {popup && (
        <div
          className="fixed right-4 top-20 z-[100] w-[min(24rem,calc(100vw-2rem))]"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${style.iconClass}`}
            >
              {style.icon}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-900">{style.title}</p>
              <p className="mt-1 break-words text-sm leading-5 text-slate-600">
                {popup.message}
              </p>
            </div>
            <button
              type="button"
              onClick={closePopup}
              aria-label="Đóng thông báo"
              className="text-xl leading-none text-slate-400 transition hover:text-slate-700"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </PopupContext.Provider>
  );
}

export function usePopup() {
  const context = useContext(PopupContext);

  if (!context) {
    throw new Error("usePopup phải được dùng bên trong PopupProvider");
  }

  return context;
}
