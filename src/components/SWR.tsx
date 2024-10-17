import { useState } from "react";
import { trpcAstroClient } from "../client";
import useSWR from "swr";


const GreetingComponent = () => {
    const { data, error } = useSWR("greeting", () =>
        trpcAstroClient.greeting.query(),
    );

    if (error) return <div>Error loading greeting.</div>;
    if (!data) return <div>Loading...</div>;

    return (
        <div>
            <div> {data.bye} </div>
        </div>
    );
};

export default GreetingComponent;