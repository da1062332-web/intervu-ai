-- PostgreSQL Initialization Script
-- Automatically creates judge0 database on startup alongside intervu_ai
CREATE DATABASE judge0;

\c judge0;
UPDATE languages SET run_cmd = '/usr/local/openjdk13/bin/java -XX:CompressedClassSpaceSize=64m -XX:MaxMetaspaceSize=128m -Xmx256m Main', compile_cmd = '/usr/local/openjdk13/bin/javac -J-XX:CompressedClassSpaceSize=64m -J-XX:MaxMetaspaceSize=128m -J-Xmx256m %s Main.java' WHERE id = 62;

