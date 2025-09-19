import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { StartProcess } from './pages/StartProcess';
import { ApplyLeave } from './pages/ApplyLeave';
import { Tasks } from './pages/Tasks';
import { Completed } from './pages/Completed';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="nav-brand">
            <h1>请假流程管理系统</h1>
          </div>
          <div className="nav-links">
            <Link to="/" className="nav-link">启动流程</Link>
            <Link to="/apply" className="nav-link">填写请假单</Link>
            <Link to="/tasks" className="nav-link">审批任务</Link>
            <Link to="/completed" className="nav-link">已结束流程</Link>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<StartProcess />} />
            <Route path="/apply" element={<ApplyLeave />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/completed" element={<Completed />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;