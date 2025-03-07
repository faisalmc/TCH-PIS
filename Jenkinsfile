pipeline {
    agent any
    stages {
        stage('Hello') {
            steps {
                echo 'Hello, World test #3! ' 
            }
        stage('docker') {
            steps {
                sh 'docker ps -a' 
            }
        }
    }
}
