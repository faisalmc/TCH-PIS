pipeline {
    agent any

    environment {
        AZURE_CLIENT_ID     = credentials('azure-client-id')
        AZURE_CLIENT_SECRET = credentials('azure-client-secret')
        AZURE_TENANT_ID     = credentials('azure-tenant-id')
    }

    /*
    stages {
        stage('Launch Docker Container') {
            steps {
                script {
                    sh '''
                    # Stop and remove any existing container
                    if [ "$(docker ps -aq -f name=tch-pis-container)" ]; then
                        echo "Stopping and removing existing container..."
                        docker stop tch-pis-container || true
                        docker rm tch-pis-container || true
                    fi

                    # Run the container in detached mode
                    docker run -d --name tch-pis -p 3000:3000 -p 3001:3001 -p 3002:3002 tch-pis-image:1.0 tail -f /dev/null
                    '''
                }
            }
        }
        
        stage('UNIT_TEST') {
            steps {
                script {
                    sh '''
                    # Clone repository, install dependencies and run tests inside the running container
                    docker exec tch-pis git clone https://github.com/faisalmc/TCH-PIS.git /app/TCH-PIS
                    docker exec tch-pis sh -c "cd /app/TCH-PIS && npm install"
                    docker exec tch-pis sh -c "cd /app/TCH-PIS && npm run test"
                    '''
                }
            }
        }
        
        stage('SonarQube Analysis') {
            steps {
                script {
                    sh '''
                    echo "Current Node.js version:"
                    node -v || echo "Node.js not found"
                    
                    # Install NVM and set Node.js to version 16
                    export NVM_DIR="$HOME/.nvm" || mkdir -p "$HOME/.nvm"
                    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
                    . "$HOME/.nvm/nvm.sh"
                    nvm install 16
                    nvm use 16
                    echo "Updated Node.js version:"
                    node -v
                    
                    # Run SonarQube Scanner (adjust parameters as needed)
                    /opt/sonar-scanner/bin/sonar-scanner \
                      -Dsonar.projectKey=TCH-PIS \
                      -Dsonar.projectName=TCH-PIS \
                      -Dsonar.projectVersion=1.0 \
                      -Dsonar.sources=services \
                      -Dsonar.language=js \
                      -Dsonar.host.url=http://209.38.120.144:9000 \
                      -Dsonar.login=squ_7cfa9c7d2e750c8eed27046bea9b2a8c0009235e
                    '''
                }
            }
        }
        
        stage('BUILD') {
            when {
                expression {
                    currentBuild.result == null || currentBuild.result == 'SUCCESS'
                }
            }
            steps {
                script {
                    sh '''
                    # Run start-all inside the container in background and log output to a file
                    docker exec tch-pis sh -c "cd /app/TCH-PIS && nohup npm run start-all > services.log 2>&1 &"
                    '''
                }
            }
        }
        
        stage('Postman Tests') {
            steps {
                script {
                    withCredentials([string(credentialsId: 'POSTMAN_API_KEY', variable: 'POSTMAN_API_KEY')]) {
                        sh 'postman login --with-api-key $POSTMAN_API_KEY'
                        sh 'postman collection run "41554359-536005ad-d0e6-44a4-b618-6b6730ffa88c"'
                    }
                }
            }
        }
        
        stage('Security Testing with OWASP ZAP') {
            steps {
                script {
                    sh '''
                    mkdir -p zap-reports
                    /opt/zaproxy/zap.sh -daemon -host 0.0.0.0 -port 8090 -config api.disablekey=true &
                    sleep 30
                    curl "http://localhost:8090/JSON/core/action/accessUrl/?url=http://209.38.120.144:3000"
                    curl "http://localhost:8090/JSON/core/action/accessUrl/?url=http://209.38.120.144:3001"
                    curl "http://localhost:8090/JSON/core/action/accessUrl/?url=http://209.38.120.144:3002"
                    sleep 30
                    curl -s "http://localhost:8090/OTHER/core/other/htmlreport/" > zap-reports/zap-report.html
                    curl "http://localhost:8090/JSON/core/action/shutdown/"
                    '''
                }
            }
        }
        */

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Deploy to AKS') {
            steps {
                script {
                    sh '''
                        echo "Logging into Azure with Service Principal"
                        az login --service-principal \
                          --username "$AZURE_CLIENT_ID" \
                          --password "$AZURE_CLIENT_SECRET" \
                          --tenant "$AZURE_TENANT_ID"

                        echo "Connecting to AKS Cluster"
                        az aks get-credentials --resource-group myResourceGroup --name myAKSCluster --overwrite-existing

                        echo "Deploying Kubernetes YAMLs"
                        kubectl apply -f "${WORKSPACE}/k8s/deployment.yaml"
                        kubectl apply -f "${WORKSPACE}/k8s/service.yaml"

                        echo "Checking rollout status"
                        kubectl rollout status deployment/tch-pis
                    '''
                }
            }
        }


    }
    
    post {
        always {
            script {
                archiveArtifacts artifacts: "zap-reports/*", allowEmptyArchive: true
                sh '''
                pkill -f "zap.sh" || true
                docker stop tch-pis || true
                docker rm tch-pis || true
                '''
            }
        }
    }
}
