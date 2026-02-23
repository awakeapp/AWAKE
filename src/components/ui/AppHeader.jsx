


function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function AppHeader({ 
  title, 
  leftNode, 
  rightNode, 
  showBack = false, 
  onBack,
  className 
}) {
  return (
    <header
      className={cn(
        // Strict Height Token: 56px (h-14) or 64px (h-16). WhatsApp uses 56px roughly on Android, 44px + safe area on iOS. We'll use 56px.
        // Needs proper padding: px-4 (16px)
        "sticky top-0 z-40 w-full h-[56px] px-4",
        "flex items-center justify-between",
        "bg-white dark:bg-slate-950",
        "border-b border-slate-200 dark:border-slate-800",
        className
      )}
    >
      {/* Left Action Area */}
      <div className="flex-1 flex justify-start items-center">
        {showBack ? (
          <div className="-ml-2">
            <BackButton onClick={onBack} className="bg-transparent hover:bg-slate-100 dark:bg-transparent dark:hover:bg-slate-800 text-primary-600 dark:text-primary-400" />
          </div>
        ) : (
          leftNode
        )}
      </div>

      {/* Center Title */}
      <div className="flex-[2] flex justify-center text-center">
        <h1 className="text-base font-semibold text-slate-900 dark:text-white truncate px-2">
          {title}
        </h1>
      </div>

      {/* Right Action Area */}
      <div className="flex-1 flex justify-end items-center gap-2">
        {rightNode}
      </div>
    </header>
  );
}
