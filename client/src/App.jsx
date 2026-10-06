import { Link, NavLink, Route, Routes } from "react-router-dom";
import QuoteListPage from "./pages/quoteListPage.jsx";
import CreateQuotePage from "./pages/createQuotePage.jsx";
import QuoteDetailPage from "./pages/quoteDetailPage.jsx";
import EditQuotePage from "./pages/editQuotePage.jsx";
import NotFoundPage from "./pages/notFoundPage.jsx";
import "./App.css";


export default function App(){
    return (
        <>
            <header className="site_header">
                <div className="wrap site_header_inner">
                    <Link to="/" className="brand">
                        HealthCoverSim
                    </Link>
                    <nav className="site_nav" aria-label="Main">
                        <NavLink to="/" end>
                            Quotes
                        </NavLink>
                        <NavLink to="/quotes/new">
                            New Quote
                        </NavLink>
                    </nav>
                </div>
            </header>

            <main className="wrap page">
                <Routes>
                    <Route path="/" element={<QuoteListPage/>} />
                    <Route path="/quotes/new" element={<CreateQuotePage/>} />
                    <Route path="/quotes/:id" element={<QuoteDetailPage/>} />
                    <Route path="/quotes/:id/edit" element={<EditQuotePage/>} />
                    <Route path="*" element={<NotFoundPage/>} />
                </Routes>
            </main>
        </>
    )
}