import HeaderPanel from "./HeaderPanel";
import HomePage from "./Home";
import NavBar from "./NavBar";

const PageMarket = () => {
  return (
    <section className="bg-white text-gray-800 dark:bg-gray-700 dark:text-gray-100 h-[100vh] overflow-auto">
      <HeaderPanel />
      <NavBar />
      <main>
        <HomePage />
      </main>
    </section>
  );
};

export default PageMarket;
