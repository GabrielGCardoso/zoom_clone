rm -rf **/**/node_modules

for item in `ls -d */`
do
    echo $item
    cd $item
    npm ci --silent
    cd ..
done