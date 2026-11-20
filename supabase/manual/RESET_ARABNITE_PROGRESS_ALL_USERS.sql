-- RESET GLOBALE ARABNITE + INVENTARIO CARTE REALI
-- Eseguire UNA SOLA VOLTA nel Supabase SQL Editor dopo aver verificato un backup.
--
-- Per TUTTI gli utenti:
--   * azzera progressi Arabnite, monete Arabnite, bustine, album, doppioni;
--   * rende nuovamente disponibili i 5 pickup iniziali e i barattoli;
--   * restituisce al pool tutte le carte numerate attualmente assegnate;
--   * annulla inserzioni attive e scambi ancora in attesa.
--
-- NON elimina account, definizioni o copie numerate (le 6.400 carte restano
-- nel pool), wallet/monete del marketplace, né lo storico delle transazioni,
-- degli scambi conclusi o delle vendite concluse.

begin;

-- Prima rimuove gli impegni attivi che puntano alle carte.
update public.sognatore_market_listings
set status = 'CANCELLED'
where status = 'ACTIVE';

update public.sognatore_trade_offers
set status = 'CANCELLED',
    completed_at = now()
where status = 'PENDING';

-- Azzera il proprietario di ogni carta: tutte le copie tornano disponibili.
update public.sognatore_card_instances
set owner_id = null
where owner_id is not null;

-- Azzera integralmente i progressi Arabnite e i pickup persistenti.
delete from public.sognatore_arabnite_pack_pickups;
delete from public.sognatore_arabnite_jar_claims;
delete from public.sognatore_arabnite_progress;

commit;

-- Verifica finale: owned_cards_remaining deve essere 0.
select
  (select count(*) from public.sognatore_card_instances where owner_id is not null) as owned_cards_remaining,
  (select count(*) from public.sognatore_arabnite_progress) as arabnite_progress_rows_remaining,
  (select count(*) from public.sognatore_arabnite_pack_pickups) as pack_pickups_remaining,
  (select count(*) from public.sognatore_arabnite_jar_claims) as jar_claims_remaining,
  (select count(*) from public.sognatore_market_listings where status = 'ACTIVE') as active_listings_remaining,
  (select count(*) from public.sognatore_trade_offers where status = 'PENDING') as pending_trades_remaining;
