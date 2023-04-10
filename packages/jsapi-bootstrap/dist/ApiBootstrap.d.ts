import React from 'react';
import type { dh as DhType } from '@deephaven/jsapi-types';
export declare const ApiContext: React.Context<DhType | null>;
export type ApiBootstrapProps = {
    apiUrl: string;
    children: JSX.Element;
    failureElement?: JSX.Element;
    setGlobally?: boolean;
};
export declare function ApiBootstrap({ apiUrl, children, failureElement, setGlobally, }: ApiBootstrapProps): JSX.Element;
export default ApiBootstrap;
//# sourceMappingURL=ApiBootstrap.d.ts.map