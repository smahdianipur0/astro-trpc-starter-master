import React from "react";
import { trpc } from "../utils/trpc";
import useSWR from "swr";


const GreetingComponent = () => {
    const { data, error } = useSWR("greeting", () =>
        fetch('https://dummyapi.online/api/pokemon/2').then(res => res.json()),
    );

    if (error) return <div>Error loading.</div>;
    if (!data) return <div>Loading...</div>;

    return (
        <div>
            <div> {data.pokemon} </div>
        </div>
    );
};

export default GreetingComponent;