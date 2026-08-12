-- 啟用 pgvector extension。
--
-- 第六章單元 7（RAG）會用到 vector 欄位型別做相似度檢索。
-- 這裡先裝好，是為了讓學員在單元 2 的環境檢查頁就能看到四項全綠，
-- 而不是等到第七個單元才發現資料庫少東西。
--
-- pgvector/pgvector image 已經把 extension 編譯好放進去了，
-- 這行只是在資料庫層級把它「啟用」。
CREATE EXTENSION IF NOT EXISTS vector;
