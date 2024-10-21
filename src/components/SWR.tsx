

import { useState } from "react";
import { trpc } from "../utils/trpc";
import useSWR from "swr";


const GreetingComponent = () => {
    const { data, error } = useSWR("greeting", () =>
        trpc.greeting.query(),
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

