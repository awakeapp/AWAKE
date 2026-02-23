import awakeLogo from '../../assets/awake_logo_new.png';

const FullPageLoader = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 pb-20">
            <div className="relative flex flex-col items-center">
                <img
                    src={awakeLogo}
                    alt="Loading..."
                    className="h-10 w-auto animate-pulse object-contain drop-shadow-xl dark:brightness-0 dark:invert"
                />
            </div>
        </div>
    );
};

export default FullPageLoader;
