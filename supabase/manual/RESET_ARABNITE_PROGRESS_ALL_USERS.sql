-- RESET GLOBALE DELLA SOLA PROGRESSIONE ARABNITE
-- Da eseguire una sola volta nel Supabase SQL Editor.
-- NON tocca account, carte numerate realmente possedute, transazioni,
-- wallet generale, mercato o scambi.
--
-- Effetti: 0 monete Arabnite, 0 bustine default, album 0/64,
-- doppioni 0, premio Adli non riscattato, 5 pickup iniziali nuovamente
-- disponibili e nessun barattolo segnato come già raccolto.

begin;

delete from public.sognatore_arabnite_pack_pickups;
delete from public.sognatore_arabnite_jar_claims;
delete from public.sognatore_arabnite_progress;

commit;

-- Verifica: tutte e tre le tabelle devono restituire 0.
select
  (select count(*) from public.sognatore_arabnite_progress) as progress_rows_remaining,
  (select count(*) from public.sognatore_arabnite_pack_pickups) as pack_pickups_remaining,
  (select count(*) from public.sognatore_arabnite_jar_claims) as jar_claims_remaining;
