-- PostgreSQL Initialization Script
-- Automatically creates judge0 database on startup alongside intervu_ai
CREATE DATABASE judge0;

\c judge0;
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'languages') THEN
    UPDATE languages SET 
      compile_cmd = '/usr/local/openjdk13/bin/javac -J-XX:+UseSerialGC -J-XX:TieredStopAtLevel=1 -J-XX:CompressedClassSpaceSize=64m -J-XX:MaxMetaspaceSize=128m -J-XX:ReservedCodeCacheSize=32m -J-Xmx256m %s Main.java',
      run_cmd = '/usr/local/openjdk13/bin/java -XX:+UseSerialGC -XX:CompressedClassSpaceSize=64m -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=32m -Xmx256m Main'
    WHERE id = 62;

    UPDATE languages SET 
      compile_cmd = '/usr/lib/jvm/java-8-openjdk-amd64/bin/javac -J-XX:+UseSerialGC -J-XX:CompressedClassSpaceSize=64m -J-XX:MaxMetaspaceSize=128m -J-XX:ReservedCodeCacheSize=32m -J-Xmx256m %s Main.java',
      run_cmd = '/usr/lib/jvm/java-8-openjdk-amd64/bin/java -XX:+UseSerialGC -XX:CompressedClassSpaceSize=64m -XX:MaxMetaspaceSize=128m -XX:ReservedCodeCacheSize=32m -Xmx256m Main'
    WHERE id = 27;
  END IF;
END $$;

