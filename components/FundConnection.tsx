import {InstrumentConnection} from '@/components/InstrumentConnection';

/**
 * @deprecated ETF compatibility wrapper.
 *
 * New code should use `InstrumentConnection` directly. This export remains so
 * older imports do not carry a second implementation of account/watchlist/fit
 * behavior while routes are migrated incrementally.
 */
export function FundConnection({id}:{id:string}){
 return <InstrumentConnection id={id} assetType="ETF"/>;
}
