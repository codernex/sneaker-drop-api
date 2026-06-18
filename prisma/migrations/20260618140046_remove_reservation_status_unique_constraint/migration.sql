-- DropIndex
DROP INDEX "reservations_user_id_drop_id_status_key";

-- CreateIndex
CREATE INDEX "reservations_user_id_drop_id_idx" ON "reservations"("user_id", "drop_id");
