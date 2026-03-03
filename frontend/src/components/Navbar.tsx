import { NavLink, useLocation } from "react-router-dom";
import { Drawer, Burger } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import "../styles/navbar.css";

const Navbar = () => {
  const [opened, { toggle, close }] = useDisclosure(false);
  const location = useLocation();
  const isAdminPath = location.pathname.startsWith("/admin");
  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `navbar-link${isActive ? " active" : ""}`;

  return (
    <>
      <header className="navbar">
        <div className="navbar-container">
          {/* Logo */}
          <div className="logo">Visualnest</div>

          {/* Desktop Menu */}
          <nav className="nav-links desktop-only">
            <NavLink to="/" end className={getNavLinkClass}>Home</NavLink>
            <NavLink to="/about" className={getNavLinkClass}>About</NavLink>
            <NavLink to="/services" className={getNavLinkClass}>Services</NavLink>
            <NavLink to="/gallery" className={getNavLinkClass}>Gallery</NavLink>
            <NavLink to="/contact" className={getNavLinkClass}>Contact</NavLink>
            <NavLink to="/admin" className={() => `navbar-link${isAdminPath ? " active" : ""}`}>Admin</NavLink>

          </nav>

          {/* Burger → ONLY MOBILE */}
          <div className="mobile-only">
            <Burger
              opened={opened}
              onClick={toggle}
              size="sm"
              aria-label="Toggle navigation"
            />
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <Drawer
        opened={opened}
        onClose={close}
        position="right"
        size="260px"
        overlayProps={{ opacity: 0.55, blur: 4 }}
      >
        <nav className="drawer-links">
          <NavLink to="/" end className={getNavLinkClass} onClick={close}>Home</NavLink>
          <NavLink to="/about" className={getNavLinkClass} onClick={close}>About</NavLink>
          <NavLink to="/services" className={getNavLinkClass} onClick={close}>Services</NavLink>
          <NavLink to="/gallery" className={getNavLinkClass} onClick={close}>Gallery</NavLink>
          <NavLink to="/contact" className={getNavLinkClass} onClick={close}>Contact</NavLink>
          <NavLink to="/admin" className={() => `navbar-link${isAdminPath ? " active" : ""}`} onClick={close}>Admin</NavLink>

        </nav>
      </Drawer>
    </>
  );
};

export default Navbar;
