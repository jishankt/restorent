import { BrowserRouter, Route, Routes } from 'react-router-dom';
import UserRouter from './Routes/UserRouter'; // Adjust path as needed
import { UserProvider } from './Context/UserContext'; // Adjust path as needed
import ChatbotModal from './components/ChatbotModal';

function App() {
    return (
        <>
            <UserProvider>
                <BrowserRouter>
                    <ChatbotModal />
                    <Routes>
                        <Route path="/*" element={<UserRouter />} />
                    </Routes>
                </BrowserRouter>
            </UserProvider>
        </>
    );
}

export default App;
