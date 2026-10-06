import { Link } from "react-router-dom";

export default function NotFoundPage(){
    return (
        <div className="notice">
            <h1>
                Page not found
            </h1>
            <p>
                There's nothing here
            </p>
            <Link to="/">
                Go to all quotes
            </Link>
        </div>
    )
}