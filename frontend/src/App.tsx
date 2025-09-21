import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { Layout, Menu, theme } from "antd";
import LeaveProcessDefinition from "./pages/LeaveProcessDefinition";
import { UnfinishedTasks } from "./pages/UnfinishedTasks";
import { ProcessManagement } from "./pages/ProcessManagement";
import { StartProcess } from "./pages/StartProcess";
// 导入页面包装组件
import ProcessInstancesPage from "./pages/ProcessInstancesPage";
import ApplicationHistoryPage from "./pages/ApplicationHistoryPage";
import CompletedTasksPage from "./pages/CompletedTasksPage";
import LeaveApplication from "./pages/LeaveApplication";

const { Header, Content, Sider } = Layout;

const App: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Router>
      <Layout>
        <Header className="flex items-center">
          <div className="text-white text-xl font-bold">请假管理系统</div>
        </Header>
        <Layout>
          <Sider width={200} className="bg-white">
            <Menu
              mode="inline"
              defaultSelectedKeys={["1"]}
              style={{ height: "100%", borderRight: 0 }}
              items={[
                { key: "1", label: <Link to="/">请假申请</Link> },
                {
                  key: "2",
                  label: <Link to="/unfinished-tasks">审批任务</Link>,
                },
                {
                  key: "3",
                  label: <Link to="/process-management">流程管理</Link>,
                },
                {
                  key: "4",
                  label: <Link to="/process-definition">流程定义</Link>,
                },
              ]}
            />
          </Sider>
          <Layout className="p-6" style={{ background: colorBgContainer }}>
            <Content>
              <Routes>
                <Route path="/" element={<LeaveApplication />} />
                <Route path="/start" element={<StartProcess />} />
                <Route path="/unfinished-tasks" element={<UnfinishedTasks />} />
                <Route
                  path="/process-definition"
                  element={<LeaveProcessDefinition />}
                />
                <Route
                  path="/process-management"
                  element={<ProcessManagement />}
                />
              </Routes>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    </Router>
  );
};

export default App;