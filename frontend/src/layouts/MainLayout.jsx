// EventMax Main Layout
// Primary layout with header and footer

import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Header from '../components/organisms/Header';
import Footer from '../components/organisms/Footer';

function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex-1 pt-16 md:pt-20"
      >
        <Outlet />
      </motion.main>
      
      <Footer />
    </div>
  );
}

export default MainLayout;
