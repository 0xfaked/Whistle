import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WalletProvider } from './context/WalletContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import ReportEditor from './pages/ReportEditor';
import ReportsFeed from './pages/ReportsFeed';
import ReportDetail from './pages/ReportDetail';
import SocialFeed from './pages/SocialFeed'; // New Import
import './App.css';
import './pages/ReportEditor.css';
import './pages/ReportsFeed.css';
import './pages/ReportDetail.css';
import './pages/SocialFeed.css'; // New CSS

const Home = () => (
  <>
    <Hero />
    <Features />
    <Testimonials />
  </>
);

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <Router>
          <div className="App">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/report" element={<ReportEditor />} />
              <Route path="/reports" element={<ReportsFeed />} />
              <Route path="/feed" element={<SocialFeed />} />
              <Route path="/reports/:id" element={<ReportDetail />} />
            </Routes>
            <Footer />
          </div>
        </Router>
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;
