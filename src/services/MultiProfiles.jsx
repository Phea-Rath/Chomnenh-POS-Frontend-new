import { useNavigate } from "react-router";

const MultiProfiles = ({ data = [], max = 5, onClickExtra }) => {
    const navigate = useNavigate();
    const initial = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAALEAAACUCAMAAADrljhyAAAAM1BMVEXl5uivtLjAxcissbXo6euttLq5vcDN0NOyt7u+wsXQ09a1ur2prrLm5ubFyczY2tze4eM1jrlKAAAEg0lEQVR4nO2c247jIAxAQzCQQLj8/9cuJO3cOtMAJoaVcl5Wq3k5shxjwHSabm5ubm5ubm5ubm5ubm7OgUhvh2wAgvdaKe3DNLw3TEE7ybYPmFTJu7fXX0DQs+Gcsy/E/5pZj+kMkzPim+2HtTBuvOyIvr/rPkOtRouzXt747s5G93b8AoSVi/fCKcxulDBb8OYkwA9nGcZQBsXZaYQfznoAZZuEc41Z/AD747Iy4oEQqnOUbZnwHuW+yntKlLF1zWXwxcJMLL6fMoSlWDgiQzfjSZaHOMLnbkEuT+KHcqe8sGHJLcMvgO1hDGtliGO9cD2CDGGrFY5LpO9hvFYLM8EdfVqAr8/iiKGvcLZ0ef5ObJapCQYjzNhCbqxRIWZiI//2Zpxxh4UP55uUiY19fTF+GtOmBeAqxW5M29oDslIkVlpjdIjjIkIpPFXsPV5YSBMZWY0fxoRpAQrTUzyh3KKCa2FMWSyaGJOWN5jxwrF9ozRGdPOfxpRncP9hjJsY0355DYyJa0WDFYS2HjdZ80iN2/QVpM1bi96N9AAA8MJMUgpPIPHGtFvTituEn1DflIXzS9IzY1LfCHqjZ6jPK5BriKC/JfO4CAtB7DtNtv6EPsFXcmPsVq/DtIXFfHtcdri6wXRDgrRve2IRx5uCdoV+AnqrTeWt19V0bbngtIeEn1RepKc+s8uV6VTfD/W4fnwq1+QF6a7/Vbl4XkF0S+IDW3qtJzjtQfcr4Iu+PjHAlB6EEmNuugsn5fzE4HKI0c2sOdNDeB4gwjtWbafOQowxAnlgczJjiBT+BCb1ZqJXpAweJ8APILjlr9QQfNFDBfjAptH07ZdA883osP99QMA7uexPKgTn6R++LNKF8R4qfAEmr5VbVxlZZ6d0enfTW+qM3TBE7PQf2L46jqocPcP+/srNqzTsyGHOFiNXp5T3YahHWck2qkqz8MPze6U41GXMaT/EJwgQ1Gr2+vB+xUt/j3XD95W2wa/stxL8t/i2GRW6ZHdKBbWKIt2PcMdQU1cRC9P+FK9c9+HM0rpCuArGHqLS9YGIMEl1MBRXtbUmGV4jvcX+6Po4x3RYq7PhJ3Fj7a7t6ez+sK2V7w5f3HRhQoOX6EuxnwjO1FXG8XtrG98n3Phrumed99KxRpm132THAtzgJvpPRPvRBaubFLQ3bE3DnDI4HThcR1xReMMVBULdG7FCeLMxHPBnr7eb0eiRiCbSZelgroEvKDrhdICPbp0bDKsUgb5hbzMaXaSMu04lTYkD3M0OIMc+KpXrh7TKrjgaKldf+GEftFVTPViGfR5WT91TEeq69hVuKvYlNvQTjp1cxWxZ+Y1zW4obOdCXdpdnCFa69tlw5ZYjC1+YyR0/u4PiGYHKeZp2iLKi3GSyH8tSZJz9czsXUjJi1uQpAp6CJq7JQys8S8Fjhl4t0A+yvz0g3Iu+o2Cf2uTVEh6e/zM+uPHthuQ2nbXjmM3huYPgY9Q2VvCLESMseDtcZhp374I+yPzpE5jRv03RCM4zi4Va50HIbethHMYchyrkH2z+PrWfZm1YAAAAAElFTkSuQmCC";

    const list = Array.isArray(data) ? data : [];
    const displayList = list.slice(0, max);
    const extraCount = list.length - max;

    return (
        <div className="inline-flex items-center">
            <div className="ml-3 relative flex items-center">
                {displayList.map((p, idx) => {
                    const imgSrc = typeof p === "string" ? p : p?.img || p?.image || p?.photo || initial;
                    const id = typeof p === "object" ? p?.id || p?.deliver_id || p?.supplier_id : null;
                    return (
                        <img
                            key={idx}
                            onClick={() => id && navigate(`/user_detail/${id}`)}
                            className="object-cover box-border rounded-full w-7 h-7 -ml-3 border-2 border-white dark:border-gray-800 hover:z-10 hover:cursor-pointer hover:border-blue-500 hover:scale-110 transition-transform"
                            src={imgSrc}
                            alt=""
                            onError={(e) => {
                                e.target.src = initial;
                            }}
                        />
                    );
                })}
                {extraCount > 0 && (
                    <div
                        onClick={onClickExtra}
                        className="w-7 h-7 -ml-3 rounded-full bg-blue-600 dark:bg-blue-500 text-white font-extrabold text-[10px] flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-xs z-10 cursor-pointer hover:scale-110 transition-transform"
                        title={`${extraCount} more`}
                    >
                        {extraCount > 99 ? "99+" : `+${extraCount}`}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultiProfiles;