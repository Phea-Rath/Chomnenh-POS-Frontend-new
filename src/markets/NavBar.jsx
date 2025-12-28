export default function NavBar() {
  return (
    <nav className="container mx-auto px-4 bg-blue-500 flex text-white justify-between p-3 px-10">
      <div>
        <ul className="flex items-center gap-5">
          <li>All Categories</li>
          <li>Products</li>
          <li>Blog</li>
          <li>Contact</li>
        </ul>
      </div>
      <div>
        <ul className="flex items-center gap-5">
          <li>Best Saller</li>
          <li>New</li>
        </ul>
      </div>
    </nav>
  );
}
